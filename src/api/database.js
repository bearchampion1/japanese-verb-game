import { supabase } from './supabaseClient';

// --- 使用者相關 ---
export const ensureUserExists = async (user) => {
  if (!user || !user.email) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single();

  if (error && error.code === 'PGRST116') {
    // User does not exist, create them
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        { email: user.email, name: user.name, role: 'player' }
      ])
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating user:', insertError);
      return null;
    }
    return newUser;
  }
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return data;
};

// --- 單字庫相關 ---
export const fetchVerbs = async () => {
  const { data, error } = await supabase
    .from('verbs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching verbs:', error);
    throw error;
  }
  return data;
};

export const addVerb = async (verb) => {
  const { data, error } = await supabase
    .from('verbs')
    .insert([{
      word: verb.word,
      hiragana: verb.hiragana,
      meaning: verb.meaning,
      type: verb.type
    }])
    .select();

  if (error) {
    console.error('Error adding verb:', error);
    throw error;
  }
  return data[0];
};

export const updateVerb = async (verb) => {
  const { data, error } = await supabase
    .from('verbs')
    .update({
      word: verb.word,
      hiragana: verb.hiragana,
      meaning: verb.meaning,
      type: verb.type
    })
    .eq('id', verb.id)
    .select();

  if (error) {
    console.error('Error updating verb:', error);
    throw error;
  }
  return data[0];
};

export const deleteVerb = async (id) => {
  const { error } = await supabase
    .from('verbs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting verb:', error);
    throw error;
  }
  return true;
};

// --- 遊戲紀錄與錯誤統計 ---
export const saveGameRecord = async ({ userEmail, userName, score, accuracy, mistakes }) => {
  if (!userEmail) return;

  try {
    // 確保該使用者存在於資料庫中，避免 Foreign Key 錯誤
    await ensureUserExists({ email: userEmail, name: userName });

    // 1. 新增總分紀錄
    const { error: insertError } = await supabase.from('game_records').insert([{
      user_email: userEmail,
      score: score,
      accuracy: accuracy
    }]);
    if (insertError) console.error('Error inserting game record:', insertError);

    // 2. 儲存錯題 (upsert)
    if (mistakes && mistakes.length > 0) {
      // Fetch existing mistakes for this user
      const { data: existingMistakes } = await supabase
        .from('user_mistakes')
        .select('*')
        .eq('user_email', userEmail);
      
      const existingMap = new Map(existingMistakes?.map(m => [m.verb_id, m.error_count]) || []);

      // Aggregate current mistakes
      const currentMistakesMap = new Map();
      mistakes.forEach(verbId => {
        currentMistakesMap.set(verbId, (currentMistakesMap.get(verbId) || 0) + 1);
      });

      const upsertData = Array.from(currentMistakesMap.entries()).map(([verbId, addedCount]) => {
        const count = existingMap.get(verbId) || 0;
        return {
          user_email: userEmail,
          verb_id: verbId,
          error_count: count + addedCount
        };
      });

      const { error: upsertError } = await supabase.from('user_mistakes').upsert(upsertData, { onConflict: 'user_email,verb_id' });
      if (upsertError) console.error('Error upserting mistakes:', upsertError);
    }
  } catch (error) {
    console.error('Error saving game record:', error);
  }
};

export const getUserHistory = async (userEmail) => {
  if (!userEmail) return { records: [], mistakes: [] };

  const { data: records } = await supabase
    .from('game_records')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false });

  const { data: mistakesData } = await supabase
    .from('user_mistakes')
    .select(`
      error_count,
      verbs (
        id, word, hiragana, meaning, type
      )
    `)
    .eq('user_email', userEmail)
    .order('error_count', { ascending: false });

  return {
    records: records || [],
    mistakes: mistakesData?.map(m => ({ ...m.verbs, error_count: m.error_count })) || []
  };
};

// --- 意見回饋 ---
export const submitFeedback = async ({ userEmail, type, content }) => {
  const { error } = await supabase
    .from('feedback')
    .insert([{
      user_email: userEmail || null,
      type: type,
      content: content
    }]);

  if (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
  return true;
};
