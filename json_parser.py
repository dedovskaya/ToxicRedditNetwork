import json
import sys
import os.path

if len(sys.argv) != 2:
    print("missing argument: filename")
    exit()

# Example: Reading JSON data from a file
# file_path = 'data\europe_100.json'
file_path = sys.argv[1]

if not os.path.exists(file_path):
    print("file not found")
    exit()

with open(file_path, 'r', encoding='utf-8') as file:
    json_data = file.read()
    input_data = json.loads(json_data)

class User():
    def __init__(self, user_id, name, links, posts, messages, user_toxicity, karma):
        self.user_id = user_id
        self.name = name
        self.links = links
        self.messages = messages
        self.user_toxicity = user_toxicity
        self.posts = posts
        self.karma = karma

        # 	"id": "t2_ojkhp",
        # "name": "ModeratorsOfEurope",
        # "toxicity": 0,
        # "submissions": [
        # 	"12aw2q2"
        # ],
        # "messages": [],
        # "karma": 10741

    def returnUser(self):
        return { "id": self.user_id, #user_id
                "name": self.name,
                "links": self.links,
                "user_toxicity": self.user_toxicity,
                "posts": self.posts,
                "messages": self.messages }

class Link():
    def __init__(self, link_id, source_user_id, target_user_id, text, link_toxicity):
        self.source_user_id = source_user_id
        self.target_user_id = target_user_id
        self.text = text
        self.link_toxicity = link_toxicity
        self.link_id = link_id

    def returnLink(self):
        return {"link_id": self.link_id,
                "source": self.source_user_id,
                "target": self.target_user_id,
                "text": self.text,
                "link_toxicity": self.link_toxicity,
                "directed": True
                }

# Get user data from europe_100.json
users = []
links_all = []
for user_id in input_data["users"]:
    userid = user_id
    name = input_data["users"][user_id]["name"]
    links = []
    posts = input_data["users"][user_id]["submissions"]
    messages_ids = input_data["users"][user_id]["messages"]
    user_toxicity = input_data["users"][user_id]["toxicity"]
    karma = input_data["users"][user_id]["karma"]

    for mid in messages_ids:
        message = input_data["messages"][mid]
        parent_message_id = message["parent"]
        if parent_message_id != None:
            try:
                user_to=input_data["messages"][parent_message_id]["user"]
            except:
                user_to = None
            link = Link(mid, user_id, user_to, message["text"], message["toxicity"])
            links.append(link.returnLink())
            links_all.append(link)
    user = User(userid, name, links, posts, messages_ids, user_toxicity, karma)
    users.append(user)

output_json = {"nodes": [], "links": []}

nodes_to_json = []
links_to_json = []
for user in users:
    nodes_to_json.append(user.returnUser())
for link in links_all:
    links_to_json.append(link.returnLink())

output_json["nodes"] = nodes_to_json
output_json["links"] = links_to_json

# Specify the file path where you want to save the JSON file
file_path = file_path.replace(".json", ".converted.json")

# Open the file in write mode and save the JSON data
with open(file_path, 'w') as file:
    json.dump(output_json, file)
