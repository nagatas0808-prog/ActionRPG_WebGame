# Google Search Console / AdSense 登録マニュアル

このゲーム群を公開し、アクセス解析や収益化を行うための基本的な手順です。

## 1. Google Search Console への登録
1. [Google Search Console](https://search.google.com/search-console/about) にアクセスし、Googleアカウントでログインします。
2. 「プロパティのタイプの選択」で「URL プレフィックス」を選択し、デプロイしたサイトのURL（例: `https://your-app-domain.netlify.app`）を入力して「続行」をクリックします。
3. 所有権の確認画面で「HTML タグ」を選択し、表示されたメタタグの `content` の値をコピーします。
4. プロジェクトの `index.html` の `<head>` 内にある共通タグブロックの `content` の値を書き換えます。
5. サイトを再度デプロイし、Search Console の画面で「確認」をクリックします。

## 2. Google AdSense への登録
1. [Google AdSense](https://www.google.com/adsense/start/) にアクセスし、Googleアカウントでログインして「ご利用開始」をクリックします。
2. 「お客様のサイト」にデプロイしたサイトのURLを入力します。
3. 「AdSense コード」が表示されるので、発行された `client` IDなどを確認します。
4. HTMLの共通タグブロックにすでに配置されているスクリプトの `client` パラメーターをご自身のIDに置き換えます。
5. AdSense の画面に戻り「審査へ進む」をクリックします。
6. 審査完了後、サイト上に自動で広告が表示されるようになります。

---
※ このファイルは `WebApps` プロジェクト共通のルールに基づき自動生成されています。
