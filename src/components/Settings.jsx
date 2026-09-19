export default function Settings() {
  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">資料庫設定</h2>
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-bold text-gray-700 mb-2">系統已升級至 Supabase</h3>
        <p className="text-sm text-gray-600 mb-4">
          我們的資料庫目前已全面升級為更高速、穩定的 Supabase (PostgreSQL) 關聯式資料庫。
        </p>
        <p className="text-sm text-gray-600 mb-4">
          所有的連線設定（包含 <strong>VITE_SUPABASE_URL</strong> 與 <strong>VITE_SUPABASE_ANON_KEY</strong>）皆已透過 Vercel 的環境變數 (Environment Variables) 進行安全管理。
        </p>
        <p className="text-sm text-gray-600 font-bold">
          您不需再從此頁面手動貼上 API 網址。
        </p>
      </div>
    </div>
  );
}
