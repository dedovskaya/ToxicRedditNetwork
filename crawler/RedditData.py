import time

import praw
import json
import logging
import functools

from textblob import TextBlob


class SetEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        return json.JSONEncoder.default(self, obj)


def get_author_id(obj):
    try:
        if obj and obj.author_fullname:
            return obj.author_fullname
    except AttributeError:
        return None
    return None


class RedditData:
    def __init__(self, subreddit, verbose=False, skip_deleted=True):
        self._reddit = praw.Reddit()
        self._reddit.read_only = True

        self._subreddit = subreddit
        self._verbose = verbose
        self._skip_deleted_users = skip_deleted
        self._start = 0

        if verbose:
            handler = logging.StreamHandler()
            handler.setLevel(logging.DEBUG)
            for logger_name in ("praw", "prawcore"):
                logger = logging.getLogger(logger_name)
                logger.setLevel(logging.DEBUG)
                logger.addHandler(handler)

        self._data = {
            'subreddit': subreddit,
            'submissions': {},
            'users': {},
            'replied_to': {},
            'replied_by': {},
            'messages': {},
        }

    def save(self, path="./"):
        self._data["duration"] = time.time() - self._start
        with open(path + self._subreddit + ".json", "w") as f:
            f.write(json.dumps(self._data, cls=SetEncoder))

    def calc(self):
        self._calc_toxicity()
        self._calc_avg_user_toxicity()
        self._calc_avg_submission_toxicity()

    def fetch_users(self):
        user_ids = self._data["users"].keys()
        for user in self._reddit.redditors.partial_redditors(user_ids):
            self._data["users"][user.fullname]["karma"] = user.comment_karma + user.link_karma
            self._data["users"][user.fullname]["name"] = user.name

    def print(self):
        print(json.dumps(self._data, cls=SetEncoder))

    def fetch(self, limit=20):
        self._start = time.time()
        for submission in self._reddit.subreddit(self._subreddit).hot(limit=limit):
            self._add_submission(submission)

    def _msg(self, *args, sep=' ', end='\n', file=None):
        if self._verbose:
            print(args, sep, end, file)

    def _add_author(self, author_id):
        if author_id and author_id not in self._data["users"]:
            self._data["users"][author_id] = {
                'id': author_id,
                'name': author_id,
                'toxicity': None,
                'submissions': set(),
                'messages': set(),
                'karma': None
            }
            self._data["replied_to"][author_id] = {}
            self._data["replied_by"][author_id] = {}

    def _add_submission(self, submission):
        author_id = get_author_id(submission)

        if not author_id and self._skip_deleted_users:
            return

        self._add_author(author_id)
        self._data['submissions'][submission.id] = {
            'id': submission.id,
            'title': submission.title,
            'toxicity': None,
            'users': set()
        }
        self._data['messages'][submission.id] = {
            'id': submission.id,
            'text': submission.selftext,
            'toxicity': None,
            'user': author_id,
            'parent': None,
            'submission': None,
            'replies': set()
        }

        self._data['users'][author_id]['submissions'].add(submission.id)

        submission.comments.replace_more(limit=0)
        for comment in submission.comments.list():
            self._add_comment(submission.id, comment)

    def _add_comment(self, submission_id, comment):
        author_id = get_author_id(comment)

        if not author_id and self._skip_deleted_users:
            return

        parent = comment.parent()
        parent_author_id = get_author_id(parent)

        if author_id:
            self._add_author(author_id)
            self._data['users'][author_id]["messages"].add(comment.id)
            self._data['submissions'][submission_id]['users'].add(author_id)

        self._data["messages"][comment.id] = {
            'id': comment.id,
            'text': comment.body,
            'user': author_id,
            'toxicity': None,
            'parent': parent.id,
            'replies': set(),
            'submission': submission_id
        }

        if parent.id in self._data["messages"]:
            self._data["messages"][parent.id]["replies"].add(comment.id)

        if parent and author_id and parent_author_id:
            if parent_author_id not in self._data["replied_to"][author_id]:
                self._data["replied_to"][author_id][parent_author_id] = 0
            self._data["replied_to"][author_id][parent_author_id] += 1

            if author_id not in self._data["replied_by"][parent_author_id]:
                self._data["replied_by"][parent_author_id][author_id] = 0
            self._data["replied_by"][parent_author_id][author_id] += 1

    def _calc_toxicity(self):
        for messageId in self._data["messages"].keys():
            message = self._data["messages"][messageId]
            text = message.get("text")
            if text and len(text) > 0:
                blob = TextBlob(text)
                message["toxicity"] = -1 * blob.sentiment[0] # sentiment[0] is in the range [-1, 1]; -1 is negative, but let's turn it around so that it fits the label

    def _calc_avg_user_toxicity(self):
        for userId in self._data["users"]:
            user = self._data["users"][userId]
            toxicities = list(map(lambda msg_id: self._data["messages"][msg_id]["toxicity"], user["messages"]))

            self._data["users"][userId]["toxicity"] = sum(toxicities) / len(toxicities) if len(toxicities) > 0 else 0

    def _calc_avg_submission_toxicity(self):
        for topic_id in self._data["submissions"]:
            toxicities = self._collect_toxicities_from_tree(topic_id)
            self._data["submissions"][topic_id]["toxicity"] = sum(toxicities) / len(toxicities) if len(toxicities) > 0 else 0

    def _collect_toxicities_from_tree(self, msg_id):
        if msg_id not in self._data["messages"]:
            return list()

        message = self._data["messages"][msg_id]
        toxicities = list(functools.reduce(lambda t, reply_id: t + self._collect_toxicities_from_tree(reply_id), message["replies"], list()))
        if message["toxicity"] is not None:
            toxicities.append(message["toxicity"])
        return toxicities


