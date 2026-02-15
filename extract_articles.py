import requests
from newspaper import Article
import pandas as pd

# Your article links
urls = [

"https://carnewschina.com/2026/01/16/china-implements-strict-ev-battery-recycling-rules-for-2026/",

"https://readmagazine.com/featured-article/automotive-industry-supply-chain-issues-in-2026-causes-impacts-and-strategic-solution/",

"https://autocrypt.io/automotive-cybersecurity-infrastructure-standard/",

"https://upstream.auto/automotive-cybersecurity-standards-and-regulations/",

"https://www.cnn.com/2025/03/26/economy/auto-tariffs-announcement",

"https://localnewsmatters.org/2025/12/31/self-driving-cars-could-receive-notices-of-traffic-violations-under-new-law-in-2026/",

"https://www.wardsauto.com/news/top-auto-industry-trends-for-2026-hybrids-software-tariffs/809053/"

]

articles = []

for url in urls:

    try:

        article = Article(url)

        article.download()

        article.parse()

        data = {
            "url": url,
            "title": article.title,
            "text": article.text
        }

        articles.append(data)

        print(f"Done: {article.title}")

    except Exception as e:

        print(f"Failed: {url}")
        print(e)


# Save to CSV
df = pd.DataFrame(articles)

df.to_csv("automotive_articles.csv", index=False)


# Save individual files

for i, article in enumerate(articles):

    filename = f"article_{i+1}.txt"

    with open(filename, "w", encoding="utf-8") as f:

        f.write(article["title"] + "\n\n")

        f.write(article["text"])


print("All articles saved successfully.")
