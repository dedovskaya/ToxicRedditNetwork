import RedditData


def main():
    import argparse

    parser = argparse.ArgumentParser(description='fetching data from reddit')

    parser.add_argument('subreddit', default='worldnews',
                        help='the subreddit to fetch the data from. default: worldnews')

    parser.add_argument('limit', default=20, help='number of topics to get')

    parser.add_argument('--fetch-users', '-u', action='store_true', default=False, required=False)
    parser.add_argument('--print-json', '-p', action='store_true', default=False, required=False)
    parser.add_argument('--verbose', action='store_true', default=False, required=False)

    args = parser.parse_args()

    data = RedditData.RedditData(args.subreddit, verbose=args.verbose)

    data.fetch(int(args.limit, 10))
    data.calc()

    if args.fetch_users:
        data.fetch_users()

    if args.print_json:
        data.print()
    else:
        data.save()


if __name__ == '__main__':
    main()
