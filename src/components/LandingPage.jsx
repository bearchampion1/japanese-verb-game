import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const JumpingCharacters = () => {
  const text = "あいうえおかきくけこさしすせそたちつてとはひふへほまみむめもなにぬねのらりるれろやゆよん";
  const chars = text.split('');
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Create the wave effect
      }
    }
  };

  const item = {
    hidden: { y: 0, opacity: 0.3 },
    show: { 
      y: [0, -15, 0],
      opacity: [0.3, 1, 0.3],
      transition: { 
        duration: 0.8,
        repeat: Infinity,
        repeatDelay: 2
      }
    }
  };

  const CharWave = () => (
    <motion.div 
      className="flex gap-6 shrink-0 px-3"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {chars.map((char, i) => (
        <motion.span key={i} variants={item} className="inline-block">
          {char}
        </motion.span>
      ))}
    </motion.div>
  );

  return (
    <div className="w-full overflow-hidden flex whitespace-nowrap py-8 text-2xl text-gray-400 font-bold [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ ease: "linear", duration: 40, repeat: Infinity }}
      >
        <CharWave />
        <CharWave />
      </motion.div>
    </div>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div 
      className="flex-1 flex flex-col justify-between items-center bg-white cursor-pointer"
      onClick={() => navigate('/game')}
    >
      {/* Top spacer */}
      <div className="flex-1"></div>
      
      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="font-bold tracking-widest text-gray-900 mb-8"
          style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', whiteSpace: 'nowrap' }}
        >
          自他動詞遊戲室
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          className="text-gray-500 tracking-widest text-xs md:text-sm"
        >
          - 點擊畫面任意處進入 -
        </motion.p>
      </div>

      {/* Bottom Animation Area */}
      <div className="flex-1 flex items-end justify-center pb-12 w-full">
        <JumpingCharacters />
      </div>
    </div>
  );
}
