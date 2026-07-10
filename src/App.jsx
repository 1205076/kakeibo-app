import React, { useState, useEffect } from 'react';
import './App.css';

const CATEGORIES = ["食費・日用品", "衣服", "美容", "教育・大学", "車", "交通費", "医療", "交際費", "趣味・スポーツ", "定期式積立預金", "その他"];

function App() {
  // 🌟 ログイン関連のステート
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('logged_in_user') || '');
  const [isLoginScreen, setIsLoginScreen] = useState(!localStorage.getItem('logged_in_user'));
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [activeTab, setActiveTab] = useState('home');
  const [wishlist, setWishlist] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categoryBudgets, setCategoryBudgets] = useState({});

  const [type, setType] = useState('expense');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [memo, setMemo] = useState('');

  const fetchData = () => {
    if (!currentUser) return;
    fetch(`https://kakeiboapphihana.pythonanywhere.com/api/wishlist?user=${currentUser}`).then(res => res.json()).then(data => setWishlist(data));
    fetch(`https://kakeiboapphihana.pythonanywhere.com/api/transactions?user=${currentUser}`).then(res => res.json()).then(data => setTransactions(data));
    fetch(`https://kakeiboapphihana.pythonanywhere.com/api/budgets?user=${currentUser}`).then(res => res.json()).then(data => setCategoryBudgets(data));
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      setIsLoginScreen(false);
      localStorage.setItem('logged_in_user', currentUser);
    }
  }, [currentUser]);

  // 🌟 ログイン・新規登録処理
  const handleAuth = (e) => {
    e.preventDefault();
    fetch('https://kakeiboapphihana.pythonanywhere.com/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: authMode, username: usernameInput, password: passwordInput })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        if (authMode === 'login') {
          setCurrentUser(usernameInput);
        } else {
          alert('登録が完了しました！続けてログインしてください。');
          setAuthMode('login');
        }
      } else {
        alert(data.message);
      }
    });
  };

  // 🌟 ログアウト処理
  const handleLogout = () => {
    setCurrentUser('');
    setIsLoginScreen(true);
    localStorage.removeItem('logged_in_user');
    setTransactions([]);
    setWishlist([]);
    setCategoryBudgets({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('https://kakeiboapphihana.pythonanywhere.com/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser, type, date, amount: Number(amount), category, memo })
    }).then(() => { setAmount(''); setMemo(''); fetchData(); setActiveTab('home'); });
  };

  const handleDelete = (id) => {
    if (window.confirm('削除しますか？')) fetch(`https://kakeiboapphihana.pythonanywhere.com/api/transactions/${id}`, { method: 'DELETE' }).then(() => fetchData());
  };

  const handleSaveBudget = (cat, amt) => {
    fetch('https://kakeiboapphihana.pythonanywhere.com/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser, category: cat, amount: Number(amt) })
    }).then(() => fetchData());
  };

  const today = new Date();
  const currentMonthString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonthString));

  const totalIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = currentMonthTransactions.filter(t => t.type === 'expense' && t.category !== '定期式積立預金').reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = currentMonthTransactions.filter(t => t.type === 'expense' && t.category === '定期式積立預金').reduce((sum, t) => sum + t.amount, 0);

  // 🌟 ログインしていない場合はログイン画面だけを表示！
  if (isLoginScreen) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F2F2F7' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '16px', width: '80%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{authMode === 'login' ? 'ログイン' : '新規アカウント作成'}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="ユーザーID (例: haruhi)" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <input type="password" placeholder="パスワード" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }} />
            <button type="submit" style={{ padding: '14px', backgroundColor: '#007AFF', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
              {authMode === 'login' ? 'ログインする' : '登録する'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ background: 'none', border: 'none', color: '#007AFF', cursor: 'pointer', fontSize: '14px' }}>
              {authMode === 'login' ? '新規作成はこちら' : 'ログイン画面に戻る'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === 'home') {
      return (
        <div className="home-screen">
          <h2 style={{ fontSize: '20px', color: '#666' }}>こんにちは、{currentUser}さん</h2>
          <h2>{today.getMonth() + 1}月の袋分け状況</h2>
          <div style={{ marginBottom: '20px' }}>
            {CATEGORIES.map(cat => {
              const budget = categoryBudgets[cat] || 0;
              if (budget === 0) return null;
              const spent = currentMonthTransactions.filter(t => t.type === 'expense' && t.category === cat).reduce((sum, t) => sum + t.amount, 0);
              const percent = Math.min((spent / budget) * 100, 100);
              const isOver = spent > budget;

              return (
                <div key={cat} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{cat}</span>
                    <span style={{ fontSize: '14px', color: isOver ? '#FF3B30' : '#666' }}>¥{spent.toLocaleString()} / ¥{budget.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: '#E5E5EA', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', backgroundColor: isOver ? '#FF3B30' : '#34C759', transition: 'width 0.3s' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="summary-box" style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
            <p style={{ color: '#34C759', fontWeight: 'bold' }}>収入: ¥{totalIncome.toLocaleString()}</p>
            <p style={{ color: '#FF3B30', fontWeight: 'bold' }}>支出: ¥{totalExpense.toLocaleString()}</p>
            <h3 style={{ marginTop: '10px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>残高: ¥{(totalIncome - totalExpense - totalSavings).toLocaleString()}</h3>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'add') {
      return (
        <div className="add-screen">
          <h2>支出・収入の追加</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button onClick={() => { setType('expense'); setCategory(CATEGORIES[0]); }} style={{ flex: 1, padding: '10px', backgroundColor: type === 'expense' ? '#FF3B30' : '#ddd', color: type === 'expense' ? 'white' : 'black', borderRadius: '5px', border: 'none' }}>支出</button>
            <button onClick={() => { setType('income'); setCategory('給与'); }} style={{ flex: 1, padding: '10px', backgroundColor: type === 'income' ? '#34C759' : '#ddd', color: type === 'income' ? 'white' : 'black', borderRadius: '5px', border: 'none' }}>収入</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div><label>日付: </label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></div>
            <div><label>金額: </label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
            <div>
              <label>カテゴリ: </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {type === 'expense' ? CATEGORIES.map(c => <option key={c} value={c}>{c}</option>) : <><option value="給与">給与</option><option value="お小遣い">お小遣い</option><option value="その他">その他</option></>}
              </select>
            </div>
            <div><label>メモ: </label><input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} /></div>
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#007AFF', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>登録する</button>
          </form>
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="history-screen">
          <h2>履歴</h2>
          {transactions.map(t => (
            <div key={t.id} style={{ borderBottom: '1px solid #eee', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>{t.date}</div>
                <div style={{ fontWeight: 'bold' }}>{t.category} <span style={{ fontSize: '12px', color: '#888', marginLeft: '5px' }}>{t.memo}</span></div>
              </div>
              <div style={{ fontWeight: 'bold', color: t.type === 'income' ? '#34C759' : '#FF3B30' }}>
                {t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}
              </div>
              <button onClick={() => handleDelete(t.id)} style={{ padding: '5px', background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer' }}>✖️</button>
            </div>
          ))}
        </div>
      );
    }
    
    if (activeTab === 'settings') {
      return (
        <div className="settings-screen">
          <h2>設定・袋分け</h2>
          
          <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0 }}>袋分け予算の設定</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>カテゴリごとに今月の予算を入力。0円はホーム画面に表示されません。</p>
            {CATEGORIES.map(cat => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ width: '120px', fontWeight: 'bold', fontSize: '14px' }}>{cat}</label>
                <span style={{ margin: '0 5px' }}>¥</span>
                <input 
                  type="number" 
                  defaultValue={categoryBudgets[cat] || 0}
                  onBlur={(e) => handleSaveBudget(cat, e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                />
              </div>
            ))}
          </div>

          {/* 🌟 ログアウトボタン */}
          <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
            <button 
              onClick={handleLogout} 
              style={{ width: '100%', padding: '14px', backgroundColor: '#FF3B30', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
              ログアウトする
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="app-container">
      <div className="content-area">{renderContent()}</div>
      <div className="bottom-nav">
        <button onClick={() => setActiveTab('home')}>🏠 ホーム</button>
        <button onClick={() => setActiveTab('add')}>➕ 追加</button>
        <button onClick={() => setActiveTab('history')}>📖 履歴</button>
        <button onClick={() => setActiveTab('settings')}>⚙️ 設定</button>
      </div>
    </div>
  );
}

export default App;