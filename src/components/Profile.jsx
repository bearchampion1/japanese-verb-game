import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import { getUserHistory } from '../api/database';

export default function Profile() {
  const { user } = useContext(UserContext);
  const [history, setHistory] = useState({ records: [], mistakes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.email) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getUserHistory(user.email);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">請先登入</h2>
        <p className="text-gray-600">登入後即可查看專屬於您的學習紀錄與錯題本！</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-4 mt-8">
      <div className="flex items-center gap-4 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
        <img src={user.picture} alt="avatar" className="w-16 h-16 rounded-full border-4 border-white shadow-md" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{user.name} 的個人紀錄</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold">資料載入中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 歷史分數區塊 (一對多) */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-blue-600">📊</span> 歷史分數
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {history.records.length === 0 ? (
                <div className="p-6 text-center text-gray-500">尚無遊戲紀錄，快去玩一場吧！</div>
              ) : (
                <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {history.records.map((record) => (
                    <li key={record.id} className="p-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
                      <div className="flex flex-col">
                        <span className="text-gray-400 text-xs">
                          {new Date(record.created_at).toLocaleString()}
                        </span>
                        <span className="font-bold text-gray-700">答對率: {record.accuracy}%</span>
                      </div>
                      <div className="text-2xl font-black text-blue-600">
                        {record.score} <span className="text-sm font-normal text-gray-500">分</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* 歷史錯題區塊 (多對多) */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-red-500">🔥</span> 錯題特訓本
            </h2>
            {history.mistakes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                太神啦！目前沒有任何錯題！
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
                {history.mistakes.map((mistake) => (
                  <div 
                    key={mistake.id} 
                    className="relative bg-white border-2 border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm hover:border-gray-300 transition-colors"
                  >
                    {/* 錯誤次數徽章 (黑邊框、紅底色) */}
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full border-2 border-black z-10 shadow-sm">
                      錯 {mistake.error_count} 次
                    </div>
                    
                    <span className="text-xs text-gray-500 font-medium tracking-widest">{mistake.hiragana}</span>
                    <span className="text-2xl font-bold text-gray-800 my-1">{mistake.word}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${mistake.type === '自動詞' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {mistake.type}
                    </span>
                    <span className="text-sm text-gray-600 mt-2">{mistake.meaning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
