# Stock Dashboard プロジェクト

## 概要
自分用の株式売買支援ダッシュボードをVercel（Next.js）で構築するプロジェクト。
リアルタイム監視ではなく、**見たい時にClaude Codeで分析して売買判断する**スタイル。

## セットアップ済みリソース

### Skills（~/.claude/skills/）
| スキル名 | 用途 |
|---------|------|
| `stock-analysis` | 株式分析全般（銘柄評価、ファンダメンタルズ） |
| `stock-technical-analysis` | テクニカル分析（RSI, MACD, SMA等の指標分析） |
| `stock-shadcn-ui` | UIコンポーネント（shadcn/ui + Tailwind） |
| `stock-vercel-deployment` | Vercelデプロイ手順・設定ガイド |

### MCP Servers（.claude/settings.json）
| MCP | 用途 | 備考 |
|-----|------|------|
| `alphavantage` | 株価・テクニカル指標・ファンダメンタルズ取得 | 無料枠: 25回/日、5回/分。1銘柄の詳細分析で約4-5回消費 |
| `vercel` | デプロイ管理・ログ確認・環境変数管理 | 初回接続時にブラウザでOAuth認証が必要 |

### Alpha Vantage API 仕様メモ
- 1リクエスト = 1種類のデータ × 1銘柄（例: AAPLの日足 = 1回、AAPLのRSI = 1回）
- 1日25回 = 約5-6銘柄を詳しく分析可能
- 上限超過時はエラーが返るだけ（BANや課金なし、翌日リセット）
- 有料プラン: $49.99/月（日次上限なし、75回/分）

## デプロイ方針
- GitHub連携でVercelに自動デプロイ（git push → 自動ビルド・デプロイ）
- Vercel MCPはデプロイ状況確認・エラーログ分析用

## 技術スタック（想定）
- Next.js + TypeScript
- Tailwind CSS + shadcn/ui
- Recharts or similar（チャート表示）
- Alpha Vantage API（データソース）

## 開発時のスキル使用ルール
株式ダッシュボード開発では、以下のスキルを適宜使用すること：
- **stock-analysis** / **stock-technical-analysis** — 分析ロジック・指標計算の実装時
- **stock-shadcn-ui** — UIコンポーネント作成時
- **stock-vercel-deployment** — デプロイ設定時
