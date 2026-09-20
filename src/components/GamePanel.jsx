import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchVerbs, saveGameRecord } from '../api/database';
import { UserContext } from '../App';

export default function GamePanel() {
  const { user } = useContext(UserContext);
  const [verbs, setVerbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [mode, setMode] = useState(null); // 'infinite' or 'fixed'
  const [targetCount, setTargetCount] = useState(10);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Game states
  const [gameQueue, setGameQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [showResult, setShowResult] = useState(false); // is the round ended?
  
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const processData = (data) => {
    // Supabase 的資料結構已經是單獨的 word, hiragana, meaning, type
    // 不需要像以前 Google Sheets 一樣拆解 in_kanji 和 tr_kanji
    const questions = data.map(item => ({
      id: item.id,
      word: item.word,
      hiragana: item.hiragana,
      type: item.type,
      meaning: item.meaning
    }));
    setVerbs(questions);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchVerbs();
      processData(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const startGame = (selectedMode) => {
    if (verbs.length === 0) return;
    
    setMode(selectedMode);
    setScore(0);
    setMistakes([]);
    
    // Shuffle verbs
    let shuffled = [...verbs].sort(() => Math.random() - 0.5);
    
    if (selectedMode === 'fixed') {
      shuffled = shuffled.slice(0, Math.min(targetCount, verbs.length));
    }
    
    setGameQueue(shuffled);
    setCurrentIndex(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setGameStarted(true);
    setShowResult(false);
  };

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9; // 稍微放慢讓發音更清晰
      window.speechSynthesis.speak(utterance);
    }
  };

  // 當題目改變（或遊戲剛開始）時，自動發音
  useEffect(() => {
    if (gameStarted && !showResult && gameQueue.length > 0) {
      const currentQ = gameQueue[currentIndex];
      if (currentQ && currentQ.word) {
        // 延遲一小段時間再發音，避免畫面還沒切換完就先出聲
        setTimeout(() => {
          playAudio(currentQ.word);
        }, 100);
      }
    }
  }, [currentIndex, gameStarted, showResult, gameQueue]);

  const handleAnswer = (answerType) => {
    if (answered) return;
    
    const currentQ = gameQueue[currentIndex];
    setSelectedAnswer(answerType);
    setAnswered(true);
    
    if (answerType === currentQ.type) {
      setScore(prev => prev + 1);
    } else {
      setMistakes(prev => [...prev, currentQ.id]);
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < gameQueue.length) {
      setCurrentIndex(prev => prev + 1);
      setAnswered(false);
      setSelectedAnswer(null);
    } else {
      if (mode === 'infinite') {
        // reshuffle and continue
        let shuffled = [...verbs].sort(() => Math.random() - 0.5);
        setGameQueue(shuffled);
        setCurrentIndex(0);
        setAnswered(false);
        setSelectedAnswer(null);
      } else {
        // Fixed mode end
        setShowResult(true);
        // 背景上傳成績
        saveGameRecord({
          userName: user ? user.name : '訪客',
          userEmail: user ? user.email : '',
          score: score,
          accuracy: Math.round((score / gameQueue.length) * 100),
          mistakes: mistakes
        }).catch(err => console.error('Failed to save record:', err));
      }
    }
  };

  if (loading) return <div className="text-center mt-20 text-xl font-bold">載入題庫中...</div>;
  if (error) return <div className="text-center mt-20 text-red-500 font-bold">錯誤: {error}</div>;
  if (verbs.length === 0) return <div className="text-center mt-20">題庫中沒有單字，請先至後台新增！</div>;

  if (!gameStarted) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center px-4">
        <h1 
          className="font-bold mb-8" 
          style={{ fontSize: 'clamp(1.5rem, 6vw, 1.875rem)', whiteSpace: 'nowrap' }}
        >
          日文自他動詞測驗
        </h1>
        <p className="mb-8 text-gray-600">目前題庫擁有 {verbs.length} 個單字</p>
        
        <div className="space-y-6">
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">模式一：無限循環</h2>
            <p className="text-sm text-gray-500 mb-4">不斷隨機出現單字，適合連續記憶練習。</p>
            <button 
              onClick={() => startGame('infinite')}
              className="w-full bg-black text-white font-bold py-2 rounded hover:bg-gray-800"
            >
              開始無限模式
            </button>
          </div>

          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-bold mb-4">模式二：固定題數測驗</h2>
            <p className="text-sm text-gray-500 mb-4">完成指定題數後計算答對率。</p>
            <div className="flex items-center gap-4 mb-4">
              <label className="font-bold">題數：</label>
              <input 
                type="number" 
                min="1" 
                max={verbs.length}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className="border p-1 w-20 rounded"
              />
            </div>
            <button 
              onClick={() => startGame('fixed')}
              className="w-full bg-black text-white font-bold py-2 rounded hover:bg-gray-800"
            >
              開始測驗模式
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center">
        <h1 className="text-3xl font-bold mb-4">測驗結束</h1>
        <p className="text-6xl font-bold mb-4">
          {Math.round((score / gameQueue.length) * 100)}%
        </p>
        <p className="text-xl mb-8">答對題數：{score} / {gameQueue.length}</p>
        <button 
          onClick={() => setGameStarted(false)}
          className="bg-black text-white font-bold py-2 px-8 rounded hover:bg-gray-800"
        >
          回到主選單
        </button>
      </div>
    );
  }

  const currentQ = gameQueue[currentIndex];
  const isCorrectAnswerIn = currentQ.type === '自動詞';
  const isCorrectAnswerTr = currentQ.type === '他動詞';

  return (
    <div className="max-w-2xl mx-auto mt-20 px-4 text-center">
      <div className="flex justify-between items-center mb-12 text-gray-500 font-bold">
        <span>題數：{currentIndex + 1} {mode === 'fixed' ? `/ ${gameQueue.length}` : ''}</span>
        <span>得分：{score}</span>
      </div>
      
      <div className="h-48 flex flex-col items-center justify-end pb-8 relative">
        {answered && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl text-gray-500 font-bold mb-2 h-8"
          >
            {currentQ.hiragana ? `【${currentQ.hiragana}】` : ''}
          </motion.div>
        )}
        <motion.div 
          key={currentQ.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3"
        >
          <div className="text-5xl md:text-6xl font-bold">
            {currentQ.word}
          </div>
          <button 
            onClick={() => playAudio(currentQ.word)}
            className="text-gray-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-gray-100"
            title="播放發音"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        </motion.div>
      </div>

      <div className="flex justify-center gap-4 md:gap-8 h-24 relative items-start">
        <AnimatePresence mode="popLayout">
          {(!answered || (answered && isCorrectAnswerIn)) && (
            <motion.button
              key="btn-in"
              layout
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
              animate={
                answered && isCorrectAnswerIn 
                  ? { scale: 1.1 } 
                  : { scale: 1 }
              }
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={() => handleAnswer('自動詞')}
              disabled={answered}
              className={`w-32 py-4 rounded-lg font-bold text-xl border-2 border-blue-600 z-10
                ${answered ? 'bg-blue-600 text-white' : 'text-blue-600 bg-white hover:bg-blue-50'}`}
            >
              自動詞
            </motion.button>
          )}

          {(!answered || (answered && isCorrectAnswerTr)) && (
            <motion.button
              key="btn-tr"
              layout
              initial={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
              animate={
                answered && isCorrectAnswerTr 
                  ? { scale: 1.1 } 
                  : { scale: 1 }
              }
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={() => handleAnswer('他動詞')}
              disabled={answered}
              className={`w-32 py-4 rounded-lg font-bold text-xl border-2 border-green-600 z-10
                ${answered ? 'bg-green-600 text-white' : 'text-green-600 bg-white hover:bg-green-50'}`}
            >
              他動詞
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="h-20 flex items-center justify-center mt-4 px-4 text-center">
        {answered && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl md:text-2xl font-bold"
          >
            <span className={isCorrectAnswerIn ? 'text-blue-600' : 'text-green-600'}>
              【{currentQ.type}】
            </span>
            <span className="ml-2 text-gray-700">{currentQ.meaning}</span>
          </motion.div>
        )}
      </div>

      {answered && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <button 
            onClick={nextQuestion}
            className="bg-black text-white font-bold py-3 px-12 rounded-full hover:bg-gray-800 text-lg shadow-lg hover:shadow-xl transition-all"
          >
            下一題
          </button>
        </motion.div>
      )}
    </div>
  );
}
