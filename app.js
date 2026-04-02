const GAS_URL = "https://script.google.com/macros/s/AKfycbxcIGFZp7IWBSMJVsMIgpPR5oVmiEJbapQyknKrJ8iVpn9ahM6z9hc_QfiDKhhSMGNgiw/exec"; 

// fetchStockData ફંક્શન - આની આગળ async હોવું જ જોઈએ
async function fetchStockData() {
    const symInput = document.getElementById('stockSearch');
    const sym = symInput.value.toUpperCase().trim();
    
    if(!sym) { 
        alert("કૃપા કરીને કંપનીનું નામ લખો"); 
        return; 
    }
    
    const btn = document.querySelector('.search-box button');
    const originalText = btn.innerText;
    
    btn.innerText = "Searching...";
    btn.disabled = true;

    try {
        // અહીં await નો ઉપયોગ થાય છે
        const response = await fetch(`${GAS_URL}?type=ff2_search&s=${sym}`);
        const res = await response.json();
        
        if(res.success) {
            const d = res.data;
            // ડેટા ભરવાનું લોજિક
            document.getElementById('p_profit').value = d.profit || 0;
            document.getElementById('p_equity').value = d.equity || 0;
            document.getElementById('p_shares').value = d.shares ? parseFloat(d.shares).toFixed(2) : 0;
            document.getElementById('p_ebit').value = d.ebit || 0;
            document.getElementById('p_ce').value = d.ce || 0;
            document.getElementById('p_debt').value = d.debt || 0;
            document.getElementById('p_div').value = d.div || 0;
            document.getElementById('p_assets').value = d.assets || 0;
            document.getElementById('p_liab').value = d.liab || 0;
            document.getElementById('p_prom').value = d.prom || 0;
            
            // જો ભાવ ના હોય
            if(!d.price || d.price == 0) {
                document.getElementById('p_price').value = "";
                alert("ડેટા મળી ગયો છે! કૃપા કરીને શેરનો 'Price' જાતે નાખો.");
            } else {
                document.getElementById('p_price').value = d.price;
                alert("ડેટા સફળતાપૂર્વક ભરાઈ ગયો છે!");
            }
        } else {
            alert("સ્ટોક મળ્યો નથી. (દા.ત. RELIANCE ટ્રાય કરો)");
        }
    } catch (e) {
        console.error("Fetch error:", e);
        alert("સર્વર કનેક્શન ફેલ! લિંક ચેક કરો.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// બાકીના ફંક્શન (runFF2, openModal, વગેરે) અહીં નીચે અકબંધ રાખવા...
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
    const ph = v.prom.toFixed(2);

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
