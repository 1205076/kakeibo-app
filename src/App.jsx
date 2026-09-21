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
  
  // 🌟 追加：締め日のステート（0なら月末締め）
  const [closingDay, setClosingDay] = useState(0);

  const [type, setType] = useState('expense');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [memo, setMemo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const fetchData = () => {
    if (!currentUser) return;
    
    // カテゴリ取得
    fetch(`${API_URL}/api/categories?user=${currentUser}`).then(res => res.json()).then(data => {
      if (Array.isArray(data)) {
        setCategories(data);
        if (data.length > 0 && !category) setCategory(data[0].name);
      }
    });
    // 履歴取得
    fetch(`${API_URL}/api/transactions?user=${currentUser}`).then(res => res.json()).then(data => {
      if (Array.isArray(data)) setTransactions(data);
    });
    // 予算取得
    fetch(`${API_URL}/api/budgets?user=${currentUser}`).then(res => res.json()).then(data => {
      if (data && !Array.isArray(data)) setCategoryBudgets(data);
    });
    // 🌟 締め日設定を取得
    fetch(`${API_URL}/api/settings?user=${currentUser}`).then(res => res.json()).then(data => {
      if (data && data.closing_day !== undefined) setClosingDay(data.closing_day);
    });
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
    });
  };

  const handleLogout = () => {
    setCurrentUser('');
    setIsLoginScreen(true);
    localStorage.removeItem('logged_in_user');
    setTransactions([]);
    setCategoryBudgets({});
    setCategories([]);
    setClosingDay(0);
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
    }).then(() => { setNewCategoryName(''); fetchData(); });
  };

  const handleDeleteCategory = (id, name) => {
    if (window.confirm(`カテゴリ「${name}」を削除しますか？`)) {
      fetch(`${API_URL}/api/categories/${id}`, { method: 'DELETE' }).then(() => fetchData());
    }
  };

  // 🌟 新しいAPI連携：締め日の保存
  const handleSaveClosingDay = (day) => {
    setClosingDay(Number(day));
    fetch(`${API_URL}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: currentUser, closing_day: Number(day) })
    });
  };

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeBudgets = categoryBudgets || {};
  const filteredTransactions = safeTransactions.filter(t => `${t?.category || ''} ${t?.memo || ''}`.toLowerCase().includes((searchQuery || '').toLowerCase()));

  // 🌟 ここから「締め日」の複雑な日付計算
  const d = new Date();
  const currentDay = d.getDate();
  let start, end;

  if (closingDay === 0) { 
    // 月末締め
    start = new Date(d.getFullYear(), d.getMonth(), 1);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  } else {
    // カスタム締め日（例：25日締めなら、前月26日〜今月25日）
    if (currentDay <= closingDay) {
      start = new Date(d.getFullYear(), d.getMonth() - 1, closingDay + 1);
      end = new Date(d.getFullYear(), d.getMonth(), closingDay);
    } else {
      start = new Date(d.getFullYear(), d.getMonth(), closingDay + 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, closingDay);
    }
  }

  const formatDate = (dateObj) => {
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
  };
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  
  // 計算された期間の取引だけを絞り込む
  const periodTransactions = safeTransactions.filter(t => t?.date >= startStr && t?.date <= endStr);
  const totalIncome = periodTransactions.filter(t => t?.type === 'income').reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
  const totalExpense = periodTransactions.filter(t => t?.type === 'expense' && t?.category !== '定期式積立預金').reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
  const totalSavings = periodTransactions.filter(t => t?.type === 'expense' && t?.category === '定期式積立預金').reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);

  // 🌟 ペースラインの計算用（全体の何%の日数が過ぎたか）
  const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const passedDays = Math.round((d.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const paceRatio = Math.min(Math.max(passedDays / totalDays, 0), 1);
  const pacePercent = paceRatio * 100;

  const inputStyle = { 
    padding: '14px', borderRadius: '10px', border: '1px solid #d1d1d6', width: '100%', 
    boxSizing: 'border-box', fontSize: '16px', WebkitAppearance: 'none', appearance: 'none', 
    backgroundColor: '#fafafa', display: 'block', margin: 0, color: '#333'
  };

  const labelStyle = {
    fontSize: '14px', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '8px', textAlign: 'left'
  };

  if (isLoginScreen) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#F2F2F7', padding: '20px', boxSizing: 'border-box' }}>
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{authMode === 'login' ? 'ログイン' : '新規アカウント作成'}</h2>
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
            <input type="text" placeholder="ユーザーID (例: haruhi)" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder="パスワード" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required style={inputStyle} />
            <button type="submit" style={{ width: '100%', padding: '14px', backgroundColor: '#007AFF', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px' }}>
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
          <p style={{ textAlign: 'left', fontWeight: 'bold', fontSize: '16px', marginBottom: '20px' }}>
            {start.getMonth() + 1}月{start.getDate()}日 〜 {end.getMonth() + 1}月{end.getDate()}日の状況
          </p>
          <div style={{ marginBottom: '20px' }}>
            {safeCategories.map(cat => {
              const budget = safeBudgets[cat.name] || 0;
              const spent = periodTransactions.filter(t => t?.type === 'expense' && t?.category === cat.name).reduce((sum, t) => sum + (Number(t?.amount) || 0), 0);
              
              const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : (spent > 0 ? 100 : 0);
              
              // 🌟 警告カラーの判定（緑 → 黄色 → 赤）
              const paceAmount = budget * paceRatio;
              let barColor = '#34C759'; // 通常（緑）
              if (budget > 0) {
                if (spent >= budget) {
                  barColor = '#FF3B30'; // 予算オーバー（赤）
                } else if (spent > paceAmount) {
                  barColor = '#FFCC00'; // 使いすぎペース（黄色）
                }
              }

              return (
                <div 
                  key={cat.id || cat.name} 
                  // 🌟 追加機能1：タップで記録画面へジャンプ！
                  onClick={() => {
                    setType('expense');
                    setCategory(cat.name);
                    
                    // 今日の日付を自動セット
                    const todayStr = formatDate(new Date());
                    setDate(todayStr);
                    
                    setActiveTab('add');
                  }}
                  style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontWeight: 'bold' }}>{cat.name}</span>
                    <span style={{ fontSize: '14px', color: barColor === '#FF3B30' ? '#FF3B30' : '#666' }}>¥{spent.toLocaleString()} / ¥{budget.toLocaleString()}</span>
                  </div>
                  
                  {/* 🌟 予算バーとペースライン */}
                  <div style={{ position: 'relative', width: '100%', height: '10px', backgroundColor: '#E5E5EA', borderRadius: '5px' }}>
                    <div style={{ width: `${percent}%`, height: '100%', backgroundColor: barColor, borderRadius: '5px', transition: 'width 0.3s, background-color 0.3s' }}></div>
                    {/* ペースを示す黒いライン */}
                    {budget > 0 && (
                      <div style={{ position: 'absolute', top: '-2px', bottom: '-2px', left: `${pacePercent}%`, width: '2px', backgroundColor: '#333', borderRadius: '2px', zIndex: 10 }}></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="summary-box" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#34C759', fontWeight: 'bold', margin: '0 0 10px 0', textAlign: 'left' }}>今期間の収入: ¥{totalIncome.toLocaleString()}</p>
            <p style={{ color: '#FF3B30', fontWeight: 'bold', margin: '0 0 10px 0', textAlign: 'left' }}>今期間の支出: ¥{totalExpense.toLocaleString()}</p>
            <h3 style={{ margin: '15px 0 0 0', borderTop: '1px solid #eee', paddingTop: '15px', textAlign: 'left' }}>残高: ¥{(totalIncome - totalExpense - totalSavings).toLocaleString()}</h3>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'add') {
      return (
        <div className="add-screen" style={{ padding: '20px', paddingBottom: '80px', boxSizing: 'border-box' }}>
          <h2 style={{ textAlign: 'left', marginBottom: '20px' }}>支出・収入の追加</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', width: '100%' }}>
            <button onClick={() => { setType('expense'); setCategory(safeCategories.length > 0 ? safeCategories[0].name : ''); }} style={{ flex: 1, width: 'auto', padding: '12px', backgroundColor: type === 'expense' ? '#FF3B30' : '#E5E5EA', color: type === 'expense' ? 'white' : '#333', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '15px' }}>支出</button>
            <button onClick={() => { setType('income'); setCategory('給与'); }} style={{ flex: 1, width: 'auto', padding: '12px', backgroundColor: type === 'income' ? '#34C759' : '#E5E5EA', color: type === 'income' ? 'white' : '#333', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '15px' }}>収入</button>
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
                  <button onClick={() => handleDelete(t.id)} style={{ width: '36px', height: '36px', padding: 0, backgroundColor: '#F2F2F7', border: 'none', borderRadius: '8px', color: '#FF3B30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: 0 }}>
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

          {/* 🌟 追加：締め日の設定ブロック */}
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0, textAlign: 'left' }}>締め日の設定</h3>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <label style={{ width: '100px', fontWeight: 'bold', fontSize: '14px', textAlign: 'left', flexShrink: 0, margin: 0 }}>毎月の締め日</label>
              <select value={closingDay} onChange={(e) => handleSaveClosingDay(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '100px', padding: '10px' }}>
                <option value="0">月末締め</option>
                <option value="5">5日締め</option>
                <option value="10">10日締め</option>
                <option value="15">15日締め</option>
                <option value="20">20日締め</option>
                <option value="25">25日締め</option>
              </select>
            </div>
          </div>
          
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}>
            <h3 style={{ marginTop: 0, textAlign: 'left' }}>カテゴリと予算の設定</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px', textAlign: 'left' }}>不要なカテゴリは右の「✖️」で削除できます。</p>
            
            {safeCategories.map(cat => (
              <div key={cat.id || cat.name} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', width: '100%' }}>
                <label style={{ width: '100px', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left', flexShrink: 0, margin: 0 }}>{cat.name}</label>
                <span style={{ margin: '0 5px', color: '#666', flexShrink: 0 }}>¥</span>
                <input 
                  type="number" 
                  defaultValue={safeBudgets[cat.name] || 0}
                  onBlur={(e) => handleSaveBudget(cat.name, e.target.value)}
                  style={{ ...inputStyle, flex: 1, width: 'auto', minWidth: '60px', padding: '10px' }}
                />
                <button onClick={() => handleDeleteCategory(cat.id, cat.name)} style={{ width: '40px', height: '40px', marginLeft: '10px', padding: 0, backgroundColor: '#F2F2F7', border: 'none', borderRadius: '10px', color: '#FF3B30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, margin: 0 }}>
                  ✖️
                </button>
              </div>
            ))}

            <form onSubmit={handleAddCategory} style={{ display: 'flex', alignItems: 'center', marginTop: '20px', gap: '10px', borderTop: '1px solid #eee', paddingTop: '20px', width: '100%' }}>
              <input 
                type="text" 
                placeholder="新しいカテゴリ名" 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)} 
                style={{ ...inputStyle, flex: 1, width: 'auto', minWidth: '100px', padding: '12px' }}
              />
              <button type="submit" style={{ width: '80px', height: '46px', padding: 0, backgroundColor: '#34C759', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', flexShrink: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                追加
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <button 
              onClick={handleLogout} 
              style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: '#FF3B30', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', margin: 0 }}>
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
      
      <div className="bottom-nav" style={{ position: 'fixed', bottom: 0, width: '100%', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px 0', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', zIndex: 100 }}>
        <button onClick={() => setActiveTab('home')} style={{ width: 'auto', background: 'none', border: 'none', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'home' ? '#007AFF' : '#999', margin: 0 }}><span style={{ fontSize: '20px', marginBottom: '4px' }}>🏠</span>ホーム</button>
        <button onClick={() => setActiveTab('add')} style={{ width: 'auto', background: 'none', border: 'none', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'add' ? '#007AFF' : '#999', margin: 0 }}><span style={{ fontSize: '20px', marginBottom: '4px' }}>➕</span>追加</button>
        <button onClick={() => setActiveTab('history')} style={{ width: 'auto', background: 'none', border: 'none', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'history' ? '#007AFF' : '#999', margin: 0 }}><span style={{ fontSize: '20px', marginBottom: '4px' }}>📖</span>履歴</button>
        <button onClick={() => setActiveTab('settings')} style={{ width: 'auto', background: 'none', border: 'none', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'settings' ? '#007AFF' : '#999', margin: 0 }}><span style={{ fontSize: '20px', marginBottom: '4px' }}>⚙️</span>設定</button>
      </div>
    </div>
  );
}

export default App;