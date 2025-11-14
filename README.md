# このプロジェクトについて
ポートフォリオとして作成したリポジトリです。
cursorを利用して、短期間でTODOアプリを作成します。

# 利用技術
Next.js + typescript + Firebaseで作成します。

# デプロイ先
https://todo-list-backend--todo-list-e8a5c.asia-east1.hosted.app/

# データ管理
ページにアクセスするとFirebase Authのゲスト（匿名ユーザー）としてログインします。
このユーザーが所持するデータ（todoリストなど）はFirestoreのTTLポリシーに従って7日間後に削除されます。
