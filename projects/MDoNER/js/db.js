/* ==========================================================================
   MDoNER — client-side "database" layer.
   Simulates the app's data store using localStorage so the demo is fully
   functional offline. Swap MDoNER_DB.* internals for real fetch() calls to
   a backend API (Node/Express + PostgreSQL/PostGIS is the intended
   production stack) without touching the UI code that calls these methods.
   ========================================================================== */
const MDoNER_DB = (() => {
  const KEYS = {
    reports: 'mdoner_reports',
    subscribers: 'mdoner_subscribers',
    districts: 'mdoner_districts'
  };

  function read(key){
    try{ return JSON.parse(localStorage.getItem(key)) || []; }
    catch(e){ return []; }
  }
  function write(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }

  const DISTRICTS = [
    'East Khasi Hills, Meghalaya','West Garo Hills, Meghalaya','Kohima, Nagaland',
    'Aizawl, Mizoram','Senapati, Manipur','Darrang, Assam','Papum Pare, Arunachal Pradesh',
    'Gangtok, Sikkim','South Tripura, Tripura','Ri-Bhoi, Meghalaya'
  ];
  const LEVELS = ['low','moderate','high','severe'];

  function seedDistricts(){
    let d = read(KEYS.districts);
    if(d.length) return d;
    d = DISTRICTS.map((name, i) => ({
      id: i + 1,
      name,
      risk: LEVELS[Math.floor(Math.random()*LEVELS.length)],
      score: Math.round(20 + Math.random()*75),
      rainfall_mm_24h: Math.round(Math.random()*140),
      updated: new Date().toISOString()
    }));
    write(KEYS.districts, d);
    return d;
  }

  /* refresh scores with small random walk to simulate a live feed */
  function tickDistricts(){
    const d = read(KEYS.districts).map(row => {
      const delta = Math.round((Math.random()-0.5) * 18);
      let score = Math.min(99, Math.max(5, row.score + delta));
      let risk = score > 80 ? 'severe' : score > 60 ? 'high' : score > 35 ? 'moderate' : 'low';
      return { ...row, score, risk,
        rainfall_mm_24h: Math.max(0, Math.round(row.rainfall_mm_24h + (Math.random()-0.5)*20)),
        updated: new Date().toISOString() };
    });
    write(KEYS.districts, d);
    return d;
  }

  function getDistricts(){ return seedDistricts(); }

  function addReport(report){
    const list = read(KEYS.reports);
    const entry = { id: Date.now(), created: new Date().toISOString(), ...report };
    list.unshift(entry);
    write(KEYS.reports, list.slice(0, 100)); // cap history
    return entry;
  }
  function getReports(){ return read(KEYS.reports); }

  function addSubscriber(sub){
    const list = read(KEYS.subscribers);
    const entry = { id: Date.now(), created: new Date().toISOString(), ...sub };
    list.unshift(entry);
    write(KEYS.subscribers, list);
    return entry;
  }
  function getSubscribers(){ return read(KEYS.subscribers); }

  return { getDistricts, tickDistricts, addReport, getReports, addSubscriber, getSubscribers, DISTRICTS };
})();
