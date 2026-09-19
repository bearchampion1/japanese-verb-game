import { useState, useContext } from 'react';
import { UserContext } from '../App';
import { submitFeedback } from '../api/database';

export default function FeedbackPanel() {
  const { user } = useContext(UserContext);
  
  const [type, setType] = useState('bug'); // 'bug', 'suggestion', 'other'
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setMessage({ type: 'error', text: '請輸入回饋內容' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await submitFeedback({
        user_name: user ? user.name : '訪客',
        user_email: user ? user.email : '無',
        type: type,
        content: content
      });
      setMessage({ type: 'success', text: '感謝您的回饋！我們已經收到您的寶貴意見。' });
      setContent('');
    } catch (err) {
      setMessage({ type: 'error', text: '送出失敗，請稍後再試：' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-8 bg-gray-50 flex-1">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl mt-8">
        <h2 className="text-2xl font-bold mb-6 text-center">意見回饋</h2>
        
        {message && (
          <div className={`p-4 mb-6 rounded font-bold text-center ${
            message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {!user && (
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded text-sm mb-2">
              <strong>提示：</strong> 您目前以「訪客」身分填寫。如果您希望我們能透過 Email 回覆您，請先在右上方使用 Google 登入。
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-bold mb-2">回饋類型</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  value="bug" 
                  checked={type === 'bug'} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-4 h-4 text-black focus:ring-black"
                />
                錯誤回報
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  value="suggestion" 
                  checked={type === 'suggestion'} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-4 h-4 text-black focus:ring-black"
                />
                功能建議
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  value="other" 
                  checked={type === 'other'} 
                  onChange={(e) => setType(e.target.value)}
                  className="w-4 h-4 text-black focus:ring-black"
                />
                其他
              </label>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-bold mb-2">詳細內容</label>
            <textarea
              className="w-full border-2 border-gray-300 p-3 rounded h-32 focus:border-black focus:outline-none transition-colors"
              placeholder="請詳細描述您遇到的問題或是想要建議的功能..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-bold py-3 px-4 rounded transition-colors ${
              isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
            }`}
          >
            {isSubmitting ? '送出中...' : '送出回饋'}
          </button>
        </form>
      </div>
    </div>
  );
}
