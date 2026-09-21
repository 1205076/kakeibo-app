import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = "https://kakeiboapphihana.pythonanywhere.com";

function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('logged_in_user') || '');
  const [isLoginScreen, setIsLoginScreen] = useState(!localStorage.getItem('logged_in_user'));
  const [authMode, setAuthMode] = useState('login');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [activeTab, setActiveTab] = useState('home');
  const [wishlist, setWishlist] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [categories, setCategories] = useState([]);

  const [type, setType] = useState('expense');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [memo, setMemo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchData = () => {
    if (!currentUser) return;
    
    fetch(`${API_URL}/api/categories?user=${currentUser}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
          if (data.length > 0 && !category) setCategory(data[0].name);
        }
      }).catch(err => console.log("カテゴリ取得エラー:", err));

    fetch(`${API_URL}/api/transactions?user=${currentUser}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTransactions(data);
      }).catch(err => console.log("履歴取得エラー:", err));

    fetch(`${API_URL}/api/budgets?user=${currentUser}`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) setCategoryBudgets(data);
      }).catch(err => console.log("予算取得エラー:", err));
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      setIsLoginScreen(false);
      localStorage.setItem('logged_in_user', currentUser);
    }
  }, [currentUser]);

  const handleAuth = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: authMode, username: usernameInput, password: passwordInput })
    }).then(res => res.json()).then(data => {
      if (data.status === 'success') {
        if (authMode === 'login') {
          setCurrentUser(usernameInput);
        } else {
          alert('登録が完了しました！続けてログインしてください。');
          setAuthMode('login');
        }
      } else { alert(data.message); }
    }).catch(() => alert("サーバーとの通信に失敗しました。"));
  };

  const handleLogout = () => {
    setCurrentUser('');
    setIsLoginScreen(true);
    localStorage.removeItem('logged_in_user');
    setTransactions([]);
    setWishlist([]);
    setCategoryBudgets({});
    setCategories([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(`${API_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser, type, date, amount: Number(amount), category, memo })
    }).then(() => { setAmount(''); setMemo(''); fetchData(); setActiveTab('home'); });
  };

  const handleDelete = (id) => {
    if (window.confirm('削除しますか？')) fetch(`${API_URL}/api/transactions/${id}`, { method: 'DELETE' }).then(() => fetchData());
  };

  const handleSaveBudget = (cat, amt) => {
    fetch(`${API_URL}/api/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser, category: cat, amount: Number(amt) })
    }).then(() => fetchData());
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName) return;
    fetch(`${API_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser, name: newCategoryName })
    }).then(() => {
      setNewCategoryName('');
      fetchData();
    });
  };

  const handleDeleteCategory = (id, name) => {
    if (window.confirm(`カテゴリ「${name}」を削除しますか？`)) {
      fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' }).then(() => fetchData());
    }
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeBudgets = categoryBudgets || {};

  const today = new Date();
  const currentMonthString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const currentMonthTransactions = safeTransactions.filter(t => t?.date?.startsWith(currentMonthString));
  const totalIncome = currentMonthTransactions.filter(t => t?.type === 'income').reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
  const totalExpense = currentMonthTransactions.filter(t => t?.type === 'expense' && t?.category !== '定期式積立預金').reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
  const totalSavings = currentMonthTransactions.filter(t => t?.type === 'expense' && t?.category === '定期式積立預金').reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
  const filteredTransactions = safeTransactions.filter(t => `${t?.category || ''} ${t?.memo || ''}`.toLowerCase().includes((searchQuery || '').toLowerCase()));

  // 🌟 デザインの共通スタイル（はみ出さず、丸みのある美しいデザイン）
  const inputStyle = { 
    padding: '14px', 
    borderRadius: '10px', 
    border: '1px solid #d1d1d6', 
    width: '100%', 
    boxSizing: 'border-box',
    fontSize: '16px', 
    WebkitAppearance: 'none', 
    appearance: 'none', 
    backgroundColor: '#fafafa',
    display: 'block',
    margin: 0,
    color: '#333'
  };

  const labelStyle = {
    fontSize: '14px', 
    fontWeight: 'bold', 
    color: '#666', 
    display: 'block', 
    marginBottom: '8px',
    textAlign: 'left' // 🌟 ここで文字を確実に左揃えにする！
  };

  if (isLoginScreen) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F2F2F7', padding: '20px', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{authMode === 'login' ? 'ログイン' : '新規アカウント作成'}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
            <input type="text" placeholder="ユーザーID (例: haruhi)" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="パスワード" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required style={inputStyle} />
            <button type="submit" style={{ padding: '14px', backgroundColor: '#007AFF', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}>
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
        <div className="home-screen" style={{ padding: '20px', paddingBottom: '80px' }}>
          <h2 style={{ fontSize: '20px', color: '#666', textAlign: 'left' }}>こんにちは、{currentUser}さん</h2>
          <h2 style={{ textAlign: 'left', marginBottom: '20px' }}>{today.getMonth() + 1}月の袋分け状況</h2>
          <div style={{ marginBottom: '20px' }}>
            {safeCategories.map(cat => {
              const budget = safeBudgets[cat.name] || 0;
              const spent = currentMonthTransactions.filter(t => t?.type === 'expense' && t?.category === cat.name).reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
              const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : (spent > 0 ? 100 : 0);
              const isOver = budget > 0 ? spent > budget : spent > 0;

              return (
                <div key={cat.id || cat.name} style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold' }}>{cat.name}</span>
                    <span style={{ fontSize: '14px', color: isOver ? '#FF3B30' : '#666' }}>¥{spent.toLocaleString()} / ¥{budget.toLocaleString()}</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', backgroundColor: '#E5E5EA', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${percent}%`, height: '100%', backgroundColor: isOver ? '#FF3B30' : '#34C759', transition: 'width 0.3s' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="summary-box" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#34C759', fontWeight: 'bold', margin: '0 0 10px 0', textAlign: 'left' }}>今月の全収入: ¥{totalIncome.toLocaleString()}</p>
            <p style={{ color: '#FF3B30', fontWeight: 'bold', margin: '0 0 10px 0', textAlign: 'left' }}>今月の全支出: ¥{totalExpense.toLocaleString()}</p>
            <h3 style={{ margin: '15px 0 0 0', borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'left' }}>残高: ¥{(totalIncome - totalExpense - totalSavings).toLocaleString()}</h3>
          </div>
        </div>
      );
    }
    
    // 🌟 追加タブ：完全に新しくデザインしたカード型レイアウト
    if (activeTab === 'add') {
      return (
        <div className="add-screen" style={{ padding: '20px', paddingBottom: '80px', boxSizing: 'border-box' }}>
          <h2 style={{ textAlign: 'left', marginBottom: '20px' }}>支出・収入の追加</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', width: '100%' }}>
            <button onClick={() => { setType('expense'); setCategory(safeCategories.length > 0 ? safeCategories[0].name : ''); }} style={{ flex: 1, padding: '12px', backgroundColor: type === 'expense' ? '#FF3B30' : '#E5E5EA', color: type === 'expense' ? 'white' : '#333', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '15px' }}>支出</button>
            <button onClick={() => { setType('income'); setCategory('給与'); }} style={{ flex: 1, padding: '12px', backgroundColor: type === 'income' ? '#34C759' : '#E5E5EA', color: type === 'income' ? 'white' : '#333', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '15px' }}>収入</button>
          </div>
          
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <label style={labelStyle}>日付</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <label style={labelStyle}>金額</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <label style={labelStyle}>カテゴリ</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
                  {type === 'expense' ? safeCategories.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>) : <><option value="給与">給与</option><option value="お小遣い">お小遣い</option><option value="その他">その他</option></>}
                </select>
              </div>
              <div style={{ width: '100%', boxSizing: 'border-box' }}>
                <label style={labelStyle}>メモ (任意)</label>
                <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} style={inputStyle} />
              </div>
              <button type="submit" style={{ width: '100%', padding: '16px', backgroundColor: '#007AFF', color: 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', boxSizing: 'border-box' }}>
                登録する
              </button>
            </form>
          </div>
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="history-screen" style={{ padding: '20px', paddingBottom: '80px', boxSizing: 'border-box' }}>
          <h2 style={{ textAlign: 'left', marginBottom: '15px' }}>全履歴</h2>
          <input 
            type="text" 
            placeholder="🔍 カテゴリやメモで検索..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            style={{ ...inputStyle, marginBottom: '20px' }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            {filteredTransactions.map(t => (
              <div key={t.id} style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: '10px', textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '4px' }}>{t.date}</div>
                  <div style={{ fontWeight: '600', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#333' }}>
                    {t.category} 
                    <span style={{ fontSize: '13px', color: '#8E8E93', marginLeft: '8px', fontWeight: 'normal' }}>{t.memo}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', color: t.type === 'income' ? '#34C759' : '#FF3B30', whiteSpace: 'nowrap' }}>
                    {t?.type === 'income' ? '+' : '-'}¥{Number(t.amount || 0).toLocaleString()}
                  </div>
                  <button onClick={() => handleDelete(t.id)} style={{ padding: '8px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '8px', color: '#FF3B30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (activeTab === 'settings') {
      return (
        <div className="settings-screen" style={{ padding: '20px', paddingBottom: '80px', boxSizing: 'border-box' }}>
          <h2 style={{ textAlign: 'left', marginBottom: '20px' }}>設定・袋分け</h2>
          
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0, textAlign: 'left' }}>カテゴリと予算の設定</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px', textAlign: 'left' }}>不要なカテゴリは右の「✖️」で削除できます。</p>
            
            {safeCategories.map(cat => (
              <div key={cat.id || cat.name} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', width: '100%' }}>
                <label style={{ width: '110px', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>{cat.name}</label>
                <span style={{ margin: '0 5px', color: '#666' }}>¥</span>
                <input 
                  type="number" 
                  defaultValue={safeBudgets[cat.name] || 0}
                  onBlur={(e) => handleSaveBudget(cat.name, e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: 0, padding: '10px' }}
                />
                <button onClick={() => handleDeleteCategory(cat.id, cat.name)} style={{ marginLeft: '10px', padding: '10px', backgroundColor: '#F2F2F7', border: 'none', borderRadius: '10px', color: '#FF3B30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✖️
                </button>
              </div>
            ))}

            <form onSubmit={handleAddCategory} style={{ display: 'flex', marginTop: '20px', gap: '10px', borderTop: '1px solid #eee', paddingTop: '20px', width: '100%' }}>
              <input 
                type="text" 
                placeholder="新しいカテゴリ名" 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)} 
                style={{ ...inputStyle, flex: 1, minWidth: 0, padding: '12px' }}
              />
              <button type="submit" style={{ padding: '12px 16px', backgroundColor: '#34C759', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', flexShrink: 0 }}>
                追加
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <button 
              onClick={handleLogout} 
              style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: '#FF3B30', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px' }}>
              ログアウトする
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="app-container" style={{ overflowX: 'hidden', backgroundColor: '#F2F2F7', minHeight: '100vh', margin: 0, padding: 0 }}>
      <div className="content-area" style={{ width: '100%', boxSizing: 'border-box' }}>{renderContent()}</div>
      
      {/* 🌟 下のメニューバーも少しオシャレに固定 */}
      <div className="bottom-nav" style={{ position: 'fixed', bottom: 0, width: '100%', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px 0', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', zIndex: 100 }}>
        <button onClick={() => setActiveTab('home')} style={{ background: 'none', border: 'none', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'home' ? '#007AFF' : '#999' }}><span style={{ fontSize: '20px', marginBottom: '4px' }}>🏠</span>ホーム</button>
        <button onClick={() => setActiveTab('add')} style={{ background: 'none', border: 'none', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'add' ? '#007AFF' : '#999' }}><span style={{ fontSize: '20px', marginBottom: '4px' }}>➕</span>追加</button>
        <button onClick={() => setActiveTab('history')} style={{ background: 'none', border: 'none', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'history' ? '#007AFF' : '#999' }}><span style={{ fontSize: '20px', marginBottom: '4px' }}>📖</span>履歴</button>
        <button onClick={() => setActiveTab('settings')} style={{ background: 'none', border: 'none', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'settings' ? '#007AFF' : '#999' }}><span style={{ fontSize: '20px', marginBottom: '4px' }}>⚙️</span>設定</button>
      </div>
    </div>
  );
}

export default App;