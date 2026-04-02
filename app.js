const GAS_URL = "https://script.google.com/macros/s/AKfycbz2yAhfLIhohLxXqvOJ1J9lA7f0Sb1qaesEO4HmWIOP7LLsCAyrI7tXLQlPYGt90t2KOQ/exec"; 

// 1. Fetch Data from Sheet
async function fetchStockData() {
    const sym = document.getElementById('stockSearch').value.toUpperCase();
    if(!sym) { alert("कृपया कंपनी का नाम लिखें"); return; }
    
    const btn = document.querySelector('.search-box button');
    btn.innerText = "Searching...";

    try {
        const response = await fetch(`${GAS_URL}?type=ff2_search&s=${sym}`);
        const res = await response.json();
        
        if(res.success) {
            const d = res.data;
            document.getElementById('p_profit').value = d.profit;
            document.getElementById('p_equity').value = d.equity;
            document.getElementById('p_shares').value = d.shares;
            document.getElementById('p_ebit').value = d.ebit;
            document.getElementById('p_ce').value = d.ce;
            document.getElementById('p_price').value = d.price;
            document.getElementById('p_debt').value = d.debt;
            document.getElementById('p_div').value = d.div;
            document.getElementById('p_assets').value = d.assets;
            document.getElementById('p_liab').value = d.liab;
            document.getElementById('p_prom').value = d.prom;
            alert("डेटा सफलतापूर्वक भर गया है!");
        } else {
            alert("स्टॉक नहीं मिला। कृपया RELIANCE ट्राई करें।");
        }
    } catch (e) {
        alert("सर्वर से कनेक्ट नहीं हो सका।");
    }
    btn.innerText = "Search";
}

// 2. Run Calculations (FF2)
let lastResults = []; // Global storage for PDF

function runFF2() {
    const v = {
        p: parseFloat(document.getElementById('p_profit').value) || 0,
        e: parseFloat(document.getElementById('p_equity').value) || 0,
        s: parseFloat(document.getElementById('p_shares').value) || 0,
        eb: parseFloat(document.getElementById('p_ebit').value) || 0,
        ce: parseFloat(document.getElementById('p_ce').value) || 0,
        pr: parseFloat(document.getElementById('p_price').value) || 0,
        d: parseFloat(document.getElementById('p_debt').value) || 0,
        div: parseFloat(document.getElementById('p_div').value) || 0,
        as: parseFloat(document.getElementById('p_assets').value) || 0,
        li: parseFloat(document.getElementById('p_liab').value) || 0,
        prom: parseFloat(document.getElementById('p_prom').value) || 0
    };

    if(!v.p || !v.s) { alert("कृपया डेटा भरें"); return; }

    const eps = (v.p / v.s).toFixed(2);
    const pe = (v.pr / eps).toFixed(2);
    const roe = ((v.p / v.e) * 100).toFixed(2);
    const roce = ((v.eb / v.ce) * 100).toFixed(2);
    const bv = (v.e / v.s).toFixed(2);
    const de = (v.d / v.e).toFixed(2);
    const dy = ((v.div / (v.pr * v.s)) * 100).toFixed(2);
    const cr = (v.as / v.li).toFixed(2);
    const ph = ((v.prom / v.s) * 100).toFixed(2);

    lastResults = [
        { l: "P/E Ratio", v: pe, g: pe < 25, t: "pe", f: `Price(${v.pr}) ÷ EPS(${eps})` },
        { l: "ROE %", v: roe + "%", g: roe > 15, t: "roe", f: `(Profit(${v.p}) ÷ Equity(${v.e})) × 100` },
        { l: "ROCE %", v: roce + "%", g: roce > 15, t: "roce", f: `(EBIT(${v.eb}) ÷ Cap.Emp(${v.ce})) × 100` },
        { l: "Book Value", v: "₹" + bv, g: true, t: "bv", f: `Equity(${v.e}) ÷ Shares(${v.s})` },
        { l: "Debt-to-Equity", v: de, g: de < 1, t: "de", f: `Debt(${v.d}) ÷ Equity(${v.e})` },
        { l: "Dividend Yield %", v: dy + "%", g: dy > 2, t: "dy", f: `(Div(${v.div}) ÷ MarketCap) × 100` },
        { l: "Current Ratio", v: cr, g: cr > 1, t: "cr", f: `Assets(${v.as}) ÷ Liab(${v.li})` },
        { l: "Promoter Holding %", v: ph + "%", g: ph > 50, t: "ph", f: `(Prom.Shares(${v.prom}) ÷ TotalShares(${v.s})) × 100` }
    ];

    const rb = document.getElementById('resultBox');
    rb.style.display = 'block';
    document.getElementById('pdfBtn').style.display = 'block';
    
    rb.innerHTML = `<h3 style="color:var(--primary); margin:0 0 10px 0;">🎯 रिपोर्ट</h3>`;
    lastResults.forEach(item => {
        rb.innerHTML += `<div class="result-item">
            <span><span class="dot ${item.g?'dot-green':'dot-red'}"></span> ${item.l}</span>
            <div><b>${item.v}</b> <button class="info-btn" onclick="openModal('${item.l}','${item.t}','${item.f}')">i</button></div>
        </div>`;
    });
}

// 3. Modal & PDF Logic
const logicDesc = {
    pe: "यह बताता है कि ₹1 कमाने के लिए आप कितने रुपये दे रहे हैं।",
    roe: "कंपनी शेयरधारकों के पैसों पर कितना मुनाफा कमा रही है।",
    roce: "कंपनी अपनी कुल पूंजी का कितना सही इस्तेमाल कर रही है।",
    bv: "कंपनी बंद होने पर एक शेयर की असली कीमत।",
    de: "कंपनी पर कितना कर्ज है। (1 से कम अच्छा है)",
    dy: "कंपनी अपनी कमाई का कितना हिस्सा बांटती है।",
    cr: "कंपनी की शॉर्ट-टर्म कर्ज चुकाने की क्षमता।",
    ph: "कंपनी के मालिकों के पास कितने शेयर हैं।"
};

function openModal(l, t, f) {
    document.getElementById('modalTitle').innerText = l;
    document.getElementById('modalBody').innerHTML = `${logicDesc[t]} <br><br> <span style="color:var(--primary)"><b>गणना:</b> ${f}</span>`;
    document.getElementById('infoModal').style.display = 'flex';
}

function closeModal() { document.getElementById('infoModal').style.display = 'none'; }

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text("FF2 Fundamental Analysis Report", 10, 10);
    let y = 30;
    lastResults.forEach(r => {
        doc.text(`${r.l}: ${r.v}`, 10, y);
        doc.setFontSize(10);
        doc.text(`Logic: ${r.f}`, 10, y + 5);
        doc.setFontSize(12);
        y += 15;
    });
    doc.save("FF2_Report.pdf");
}
