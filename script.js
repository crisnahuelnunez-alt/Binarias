/// Función de utilidad para calcular el límite de racha basado en el umbral del 3%
const calculateLossStreakLimit = (winRate) => {
    if (winRate >= 1 || winRate <= 0.5) return 20; // Límite de seguridad si el Win Rate es 50% o menos
    const probLoss = 1 - winRate;
    let racha = 1;
    while (true) {
        let probRacha = Math.pow(probLoss, racha);
        if (probRacha <= 0.03) { // Umbral del 3%
            return racha;
        }
        racha++;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    const App = {
        state: {
            currentUser: null, initialBalance: 0, currentBalance: 0, operationNumber: 1, lastInvestment: 0, history: [],
            strategy: 'uas', payout: 0.87,
            uas: { 
                phase: 'ACUMULACIÓN', takeProfit: 0, stopLoss: 0, riskPerTrade: 5, lossStreakLimit: 4, 
                consecutiveLosses: 0, winnerThreshold: 0, lastLossAmount: 0, expectedWinRate: 0 
            },
            masaniello_pro: { cyclesToComplete: 3, winsPerCycle: 4, tradesPerCycle: 10, currentCycle: 1, cycleWins: 0, cycleTrades: 0, cycleStartCapital: 0, fixedRiskCapital: 100 },
            masaniello: { 
                totalTrades: 10, expectedWins: 4, winsSoFar: 0, tradesDone: 0, takeProfit: 50, earlyExitEnabled: true, 
                lastLossAmount: 0, 
                recoveryMode: false, 
                currentLossStreakAmount: 0 
            }
        },
        ui: {
            userScreen: document.getElementById('user-screen'),
            mainMenuScreen: document.getElementById('main-menu-screen'),
            dashboard: document.getElementById('dashboard'),
            historyScreen: document.getElementById('history-screen'),
            statsScreen: document.getElementById('stats-screen'),
            usernameInput: document.getElementById('username'),
            loginBtn: document.getElementById('login-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            welcomeMessage: document.getElementById('welcome-message'),
            goToSessionBtn: document.getElementById('go-to-session-btn'),
            goToHistoryBtn: document.getElementById('go-to-history-btn'),
            goToStatsBtn: document.getElementById('go-to-stats-btn'),
            setupCard: document.getElementById('setup-card'),
            liveCard: document.getElementById('live-card'),
            historyCard: document.getElementById('history-card'),
            journalCard: document.getElementById('journal-card'),
            startBtn: document.getElementById('startBtn'),
            winBtn: document.getElementById('winBtn'),
            lossBtn: document.getElementById('lossBtn'),
            saveSessionBtn: document.getElementById('save-session-btn'),
            initialBalanceInput: document.getElementById('initial-balance'),
            operationLabel: document.getElementById('operation-label'),
            investmentAmount: document.getElementById('investment-amount'),
            tableContent: document.getElementById('tableContent'),
            journalSummary: document.getElementById('journal-summary'),
            strategySelect: document.getElementById('strategy'),
            strategyInfoBox: document.getElementById('strategy-info-box'),
            uasGroup: document.getElementById('uas-group'),
            uasStopLoss: document.getElementById('uas-stop-loss'),
            uasRiskPercent: document.getElementById('uas-risk-percent'),
            uasLossStreak: document.getElementById('uas-loss-streak'),
            uasWinRateSetup: document.getElementById('uas-win-rate-setup'),
            masanielloProGroup: document.getElementById('masaniello-pro-group'),
            masaProCycles: document.getElementById('masa-pro-cycles'),
            masaProWins: document.getElementById('masa-pro-wins'),
            masaProTrades: document.getElementById('masa-pro-trades'),
            masaProFixedRisk: document.getElementById('masa-pro-fixed-risk'),
            masanielloGroup: document.getElementById('masaniello-group'),
            masaTakeProfit: document.getElementById('masa-take-profit'),
            masaEarlyExit: document.getElementById('masa-early-exit'),
            allowDecimals: document.getElementById('allowDecimals'),
            payoutRateInput: document.getElementById('payoutRate'),
            phaseDisplay: document.getElementById('phase-display'),
            backToMenuBtn: document.getElementById('backToMenuBtn'),
            backToMenuFromHistoryBtn: document.getElementById('back-to-menu-from-history-btn'),
            backToMenuFromStatsBtn: document.getElementById('back-to-menu-from-stats-btn'),
            sessionNotes: document.getElementById('session-notes'),
            savedSessionsList: document.getElementById('saved-sessions-list'),
            scoreboard: document.getElementById('scoreboard'),
            sbInitial: document.getElementById('sb-initial'),
            sbCurrent: document.getElementById('sb-current'),
            sbProfit: document.getElementById('sb-profit'),
            // NUEVO ELEMENTO
            sbProfitPercent: document.getElementById('sb-profit-percent'),
            personalStatsPanel: document.getElementById('personal-stats-panel'),
            sessionEndModal: document.getElementById('session-end-modal'),
            endSessionManualBtn: document.getElementById('end-session-manual-btn'),
        },
        charts: {
            balanceChart: null,
            sessionPlChart: null
        },
        showNotification(message, type = 'info') {
            const container = document.getElementById('notification-container');
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            container.appendChild(notification);
            setTimeout(() => { notification.remove(); }, 4000);
        },
        // --- FUNCIÓN DE CONEXIÓN AL BACKEND PYTHON ---
        async validarEstrategiaEnPython(winRate, payout) {
            const url = "http://127.0.0.1:5000/analizar-uas"; 
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ winRate: winRate, payout: payout }) 
                });

                if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }

                const data = await response.json();
                return data; 
                
            } catch (error) {
                this.showNotification(`Error: El servidor Python no está corriendo. Inicia 'app_backend.py'.`, 'error');
                console.error("Fetch Error:", error);
                return { status: "error", mensaje: "No hay conexión con el backend." }; 
            }
        },
        // --- FIN FUNCIÓN DE CONEXIÓN ---
        math: {
            combinations(n, k) { if (k < 0 || k > n) return 0; if (k === 0 || k === n) return 1; if (k > n / 2) k = n - k; let r = 1; for (let i = 1; i <= k; i++) { r = r * (n - i + 1) / i; } return r; },
            calculateMasanielloInvestment(K, N, E, Q) { let C = 1, T = 0, Ev = 0; if (N <= 0 || E <= 0 || E > N) return K; for (let i = 0; i <= N - E; i++) { Ev = E + i; T += this.combinations(Ev - 1, E - 1) * Math.pow(Q - 1, E) * Math.pow(1, i); } C = T / Math.pow(Q, N); if (C >= 1) return K; return (K * C) / (1 - C); }
        },
        init() {
            this.bindEvents();
            const hash = window.location.hash.substring(1);
            const loggedInUser = sessionStorage.getItem('currentUser');
            if (loggedInUser) {
                this.state.currentUser = loggedInUser;
                if (hash && hash !== 'user') { this._displayScreen(hash); } 
                else { this.showScreen('main-menu'); }
            } else {
                this._displayScreen('user');
            }
            Chart.defaults.color = 'rgba(234, 234, 234, 0.8)';
            Chart.defaults.font.family = "'Inter', sans-serif";
            Chart.defaults.borderColor = 'rgba(0, 255, 255, 0.2)';
            
            // Llama a updateUI al inicio para mostrar la descripción de la estrategia por defecto
            if (this.state.currentUser) {
                this.updateUI();
            }
        },
        bindEvents() {
            this.ui.loginBtn.addEventListener('click', () => this.login());
            this.ui.logoutBtn.addEventListener('click', () => this.logout());
            this.ui.goToSessionBtn.addEventListener('click', () => this.showScreen('dashboard-setup'));
            this.ui.goToHistoryBtn.addEventListener('click', () => this.showScreen('history'));
            this.ui.goToStatsBtn.addEventListener('click', () => this.showScreen('stats'));
            this.ui.startBtn.addEventListener('click', () => this.startTrading());
            this.ui.winBtn.addEventListener('click', () => this.logResult(true));
            this.ui.lossBtn.addEventListener('click', () => this.logResult(false));
            this.ui.strategySelect.addEventListener('change', () => this.updateUI());
            this.ui.backToMenuBtn.addEventListener('click', () => this.showScreen('main-menu'));
            this.ui.backToMenuFromHistoryBtn.addEventListener('click', () => this.showScreen('main-menu'));
            this.ui.backToMenuFromStatsBtn.addEventListener('click', () => this.showScreen('main-menu'));
            this.ui.saveSessionBtn.addEventListener('click', () => this.saveSession());
            // NUEVO EVENTO PARA EL BOTÓN MANUAL
            this.ui.endSessionManualBtn.addEventListener('click', () => this.endSession(true));

            window.addEventListener('popstate', (event) => {
                const loggedInUser = sessionStorage.getItem('currentUser');
                if (!loggedInUser) { this._displayScreen('user'); return; }
                if (event.state && event.state.screen) { this._displayScreen(event.state.screen); } 
                else { this._displayScreen('main-menu'); }
            });
        },
        login() {
            const username = this.ui.usernameInput.value.trim();
            if (!username) { this.showNotification('Por favor, ingresa un nombre de usuario.', 'error'); return; }
            sessionStorage.setItem('currentUser', username);
            this.showMainMenu(username);
        },
        logout() {
            sessionStorage.removeItem('currentUser');
            this.state.currentUser = null;
            this.ui.usernameInput.value = '';
            this.showScreen('user');
        },
        showMainMenu(username) {
            this.state.currentUser = username;
            this.ui.welcomeMessage.textContent = `¡Hola, ${username}!`;
            this.showScreen('main-menu');
        },
        showScreen(screenName) {
            const currentHash = window.location.hash.substring(1);
            if (screenName !== currentHash) {
                history.pushState({ screen: screenName }, '', `#${screenName}`);
            }
            this._displayScreen(screenName);
        },
        _displayScreen(screenName) {
            this.ui.userScreen.classList.add('hidden');
            this.ui.mainMenuScreen.classList.add('hidden');
            this.ui.dashboard.classList.add('hidden');
            this.ui.historyScreen.classList.add('hidden');
            this.ui.statsScreen.classList.add('hidden');
            this.ui.sessionEndModal.classList.add('hidden');
            
            let elementToShow;
            if (screenName === 'user') { elementToShow = this.ui.userScreen; }
            else if (screenName === 'main-menu') { elementToShow = this.ui.mainMenuScreen; }
            else if (screenName === 'dashboard-setup') {
                this.resetSessionState();
                const lastBalance = this.getLastBalance();
                this.ui.initialBalanceInput.value = lastBalance ? lastBalance.toFixed(2) : '';
                this.ui.uasStopLoss.value = lastBalance ? (lastBalance * 0.8).toFixed(0) : '20';
                this.updateUI(); // Asegura que la descripción se cargue al entrar en el setup
                elementToShow = this.ui.dashboard;
            }
            else if (screenName === 'history') {
                this.renderAllUserSessions();
                elementToShow = this.ui.historyScreen;
            }
            else if (screenName === 'stats') {
                this.renderStatsPage();
                elementToShow = this.ui.statsScreen;
            }

            if (elementToShow) {
                elementToShow.classList.remove('hidden');
                void elementToShow.offsetWidth;
                
                // Aplicar fade-in al elemento interno que contiene el contenido
                const fadeElement = elementToShow.querySelector('.fade-in') || elementToShow;
                fadeElement.classList.add('fade-in');
            }
        },
        getLastBalance() {
            const sessions = this.loadUserSessions();
            return sessions.length > 0 ? sessions[0].finalBalance : null;
        },
        loadUserSessions() {
            if (!this.state.currentUser) return [];
            return JSON.parse(localStorage.getItem(`tradingSessions_${this.state.currentUser}`)) || [];
        },
        saveUserSessions(sessions) {
            if (!this.state.currentUser) return;
            localStorage.setItem(`tradingSessions_${this.state.currentUser}`, JSON.stringify(sessions));
        },
        saveSession() {
            const notes = this.ui.sessionNotes.value;
            const profitLoss = this.state.currentBalance - this.state.initialBalance;
            const sessionData = {
                date: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
                initialBalance: this.state.initialBalance,
                finalBalance: this.state.currentBalance,
                profitLoss: profitLoss,
                history: this.state.history,
                notes: notes
            };
            let savedSessions = this.loadUserSessions();
            savedSessions.unshift(sessionData);
            this.saveUserSessions(savedSessions);
            this.showNotification('Sesión guardada con éxito.', 'success');
            this.ui.sessionEndModal.classList.add('hidden');
            this.showMainMenu(this.state.currentUser);
        },
        renderAllUserSessions() {
            const sessions = this.loadUserSessions();
            this.calculateAndDisplayPersonalStats(sessions);
            const container = this.ui.savedSessionsList;
            if (sessions.length === 0) {
                container.innerHTML = '<p>No hay sesiones guardadas todavía para este usuario.</p>';
                return;
            }
            container.innerHTML = '';
            sessions.forEach((session) => {
                const profitColor = session.profitLoss >= 0 ? 'var(--color-win)' : 'var(--color-loss)';
                let historyTableHTML = '<table><thead><tr><th>Op#</th><th>Ciclo</th><th>Invertido</th><th>Resultado</th><th>G/P</th><th>Balance</th></tr></thead><tbody>';
                session.history.forEach(op => {
                     const rowClass = op.result === 'WIN' ? 'win-row' : 'loss-row';
                     const resultColor = op.netResult >= 0 ? 'var(--color-secondary)' : 'var(--color-loss)';
                     const cycleText = op.cycle ? op.cycle : '-';
                     historyTableHTML += `<tr class="${rowClass}"><td>${op.op}</td><td>${cycleText}</td><td>$${op.investment.toFixed(2)}</td><td>${op.result}</td><td style="color: ${resultColor}">$${op.netResult.toFixed(2)}</td><td>$${op.balance.toFixed(2)}</td></tr>`;
                });
                historyTableHTML += '</tbody></table>';
                const sessionElement = document.createElement('details');
                sessionElement.className = 'session-details';
                sessionElement.innerHTML = `
                    <summary><span>${session.date}</span><span style="color: ${profitColor}; font-weight: 800;">G/P: $${session.profitLoss.toFixed(2)}</span></summary>
                    <div class="session-details-content">
                        <p><strong>Balance:</strong> $${session.initialBalance.toFixed(2)} ➔ $${session.finalBalance.toFixed(2)}</p>
                        ${historyTableHTML}
                        <p><strong>Notas:</strong></p>
                        <div class="session-notes">${session.notes || '<em>Sin notas.</em>'}</div>
                    </div>`;
                container.appendChild(sessionElement);
            });
        },
        calculateAndDisplayPersonalStats(sessions) {
            let totalSessions = sessions.length, totalProfitLoss = 0, totalTrades = 0, totalWins = 0;
            sessions.forEach(session => {
                totalProfitLoss += session.profitLoss;
                if (session.history) {
                    session.history.forEach(op => {
                        totalTrades++;
                        if (op.result === 'WIN') totalWins++;
                    });
                }
            });
            const totalLosses = totalTrades - totalWins;
            const winRate = totalTrades > 0 ? (totalWins / totalTrades * 100) : 0;
            this.ui.personalStatsPanel.innerHTML = `
                <div class="stats-item"><span class="stats-label">Total Sesiones</span><span class="stats-value">${totalSessions}</span></div>
                <div class="stats-item"><span class="stats-label">G/P Neto</span><span class="stats-value ${totalProfitLoss >= 0 ? 'positive' : 'negative'}">$${totalProfitLoss.toFixed(2)}</span></div>
                <div class="stats-item"><span class="stats-label">Tasa de Éxito</span><span class="stats-value ${winRate >= 50 ? 'positive' : 'negative'}">${winRate.toFixed(1)}%</span></div>
                <div class="stats-item"><span class="stats-label">Total Operaciones</span><span class="stats-value">${totalTrades}</span></div>
                <div class="stats-item"><span class="stats-label">Operaciones Ganadas</span><span class="stats-value positive">${totalWins}</span></div>
                <div class="stats-item"><span class="stats-label">Operaciones Perdidas</span><span class="stats-value negative">${totalLosses}</span></div>`;
        },
        renderStatsPage() {
            // Re-insertar la estructura HTML base por si fue eliminada en un mensaje de "no hay datos"
            this.ui.statsScreen.innerHTML = `
                <div class="card">
                    <h2>Panel de Estadísticas</h2>
                    <div class="stats-highlight-grid">
                        <div class="stats-highlight-card"><span class="label">Mejor Sesión (G/P)</span><span class="value positive" id="best-session-value">$0.00</span><span class="date" id="best-session-date">--/--/----</span></div>
                        <div class="stats-highlight-card"><span class="label">Mayor Racha de Victorias</span><span class="value" id="longest-streak-value">0</span><span class="date">Operaciones</span></div>
                        <div class="stats-highlight-card"><span class="label">Sesión más Efectiva</span><span class="value" id="best-winrate-value">0%</span><span class="date" id="best-winrate-date">--/--/----</span></div>
                    </div>
                </div>
                <div class="card"><h2>Evolución del Capital</h2><canvas id="balance-chart"></canvas></div>
                <div class="card"><h2>Resultado por Sesión (Últimas 15)</h2><canvas id="session-pl-chart"></canvas></div>
                <div class="action-buttons"><button class="btn-secondary" id="back-to-menu-from-stats-btn">Volver al Menú</button></div>`;
            this.ui.backToMenuFromStatsBtn = document.getElementById('back-to-menu-from-stats-btn');
            this.ui.backToMenuFromStatsBtn.addEventListener('click', () => this.showScreen('main-menu'));

            const sessions = this.loadUserSessions().slice().reverse();
            if (!sessions || sessions.length === 0) {
                this.ui.statsScreen.querySelector('.card').innerHTML = `
                    <h2>Panel de Estadísticas</h2>
                    <p>No hay datos suficientes para generar estadísticas. ¡Completa al menos una sesión!</p>`;
                return;
            }

            let bestSession = { profit: -Infinity, date: '' },
                bestWinRateSession = { rate: -1, date: '' },
                longestStreak = 0, currentStreak = 0;

            sessions.forEach(session => {
                if (session.profitLoss > bestSession.profit) bestSession = { profit: session.profitLoss, date: session.date };
                
                if (session.history && session.history.length > 0) {
                    let wins = 0;
                    session.history.forEach(op => {
                        if (op.result === 'WIN') { wins++; currentStreak++; }
                        else { longestStreak = Math.max(longestStreak, currentStreak); currentStreak = 0; }
                    });
                    longestStreak = Math.max(longestStreak, currentStreak);
                    const winRate = (wins / session.history.length) * 100;
                    if (winRate > bestWinRateSession.rate) {
                        bestWinRateSession = { rate: winRate, date: session.date };
                    }
                }
            });

            document.getElementById('best-session-value').textContent = `$${bestSession.profit.toFixed(2)}`;
            document.getElementById('best-session-date').textContent = bestSession.date;
            document.getElementById('longest-streak-value').textContent = longestStreak;
            document.getElementById('best-winrate-value').textContent = `${bestWinRateSession.rate.toFixed(1)}%`;
            document.getElementById('best-winrate-date').textContent = bestWinRateSession.date;

            const balanceHistory = [], sessionPLs = [], labels = [];
            sessions.forEach(session => {
                balanceHistory.push(session.finalBalance);
                sessionPLs.push(session.profitLoss);
                labels.push(session.date.split(',')[0]);
            });

            this.renderBalanceChart(labels, balanceHistory);
            this.renderSessionPLChart(labels.slice(-15), sessionPLs.slice(-15));
        },
        renderBalanceChart(labels, data) {
            const ctx = document.getElementById('balance-chart').getContext('2d');
            if (this.charts.balanceChart) this.charts.balanceChart.destroy();
            this.charts.balanceChart = new Chart(ctx, {
                type: 'line',
                data: { labels, datasets: [{ label: 'Capital Acumulado', data, borderColor: 'rgba(0, 255, 255, 1)', backgroundColor: 'rgba(0, 255, 255, 0.2)', fill: true, tension: 0.3 }] },
                options: { scales: { y: { beginAtZero: false } } }
            });
        },
        renderSessionPLChart(labels, data) {
            const ctx = document.getElementById('session-pl-chart').getContext('2d');
            if (this.charts.sessionPlChart) this.charts.sessionPlChart.destroy();
            this.charts.sessionPlChart = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [{ label: 'Ganancia/Pérdida por Sesión', data, backgroundColor: data.map(v => v >= 0 ? 'rgba(57, 255, 20, 0.7)' : 'rgba(255, 45, 85, 0.7)'), borderColor: data.map(v => v >= 0 ? '#39FF14' : '#FF2D55'), borderWidth: 1 }] },
                options: { scales: { y: { beginAtZero: true } } }
            });
        },
        resetSessionState() {
            Object.assign(this.state, {
                initialBalance: 0, currentBalance: 0, operationNumber: 1, lastInvestment: 0, history: [],
                uas: { phase: 'ACUMULACIÓN', takeProfit: 0, stopLoss: 0, riskPerTrade: 5, lossStreakLimit: 4, consecutiveLosses: 0, winnerThreshold: 0, lastLossAmount: 0, expectedWinRate: 0 },
                masaniello_pro: { cyclesToComplete: 3, winsPerCycle: 4, tradesPerCycle: 10, currentCycle: 1, cycleWins: 0, cycleTrades: 0, cycleStartCapital: 0, fixedRiskCapital: 100 },
                // Restauramos el recoveryMode
                masaniello: { totalTrades: 10, expectedWins: 4, winsSoFar: 0, tradesDone: 0, takeProfit: 50, earlyExitEnabled: true, lastLossAmount: 0, recoveryMode: false, currentLossStreakAmount: 0 } 
            });
            this.ui.scoreboard.classList.add('hidden');
            this.ui.setupCard.classList.remove('hidden');
            this.ui.liveCard.classList.add('hidden');
            this.ui.historyCard.classList.add('hidden');
            this.ui.initialBalanceInput.value = '';
            this.ui.tableContent.innerHTML = '';
            this.ui.sessionNotes.value = '';
            this.updateUI();
        },
        async startTrading() {
            const balance = parseFloat(this.ui.initialBalanceInput.value);
            if (!balance || balance <= 0) { this.showNotification("Introduce un capital inicial válido.", 'error'); return; }
            this.state.initialBalance = balance;
            this.state.currentBalance = balance;
            this.state.strategy = this.ui.strategySelect.value;
            this.state.payout = parseFloat(this.ui.payoutRateInput.value) / 100;
            
            // --- LÓGICA UNIVERSAL DE VALIDACIÓN Y CÁLCULO ---
            if (this.state.strategy === 'uas') {
                const winRateValue = parseFloat(this.ui.uasWinRateSetup.value); // Valor en %
                const payoutValue = parseFloat(this.ui.payoutRateInput.value); // Valor en %

                const analisis = await this.validarEstrategiaEnPython(winRateValue, payoutValue);
                
                if (analisis.status === 'inviable' || analisis.status === 'error') {
                    this.showNotification(`⚠️ ${analisis.mensaje}`, 'error'); 
                    return;
                }

                this.state.uas.expectedWinRate = winRateValue / 100;
                this.state.uas.lossStreakLimit = analisis.limiteRacha; 
                
                this.state.uas.takeProfit = this.state.initialBalance * 1.20;
                this.state.uas.stopLoss = parseFloat(this.ui.uasStopLoss.value);
                this.state.uas.riskPerTrade = parseFloat(this.ui.uasRiskPercent.value);
                this.state.uas.winnerThreshold = this.state.initialBalance * 1.10;
                if (this.state.uas.stopLoss >= this.state.initialBalance) { this.showNotification("El límite de pérdida debe ser menor que tu capital inicial.", 'error'); return; }

            } else if (this.state.strategy === 'masaniello_pro') {
                const m = this.state.masaniello_pro;
                m.cyclesToComplete = parseInt(this.ui.masaProCycles.value);
                m.winsPerCycle = parseInt(this.ui.masaProWins.value);
                m.tradesPerCycle = parseInt(this.ui.masaProTrades.value);
                m.cycleStartCapital = balance;
                m.fixedRiskCapital = parseFloat(this.ui.masaProFixedRisk.value); 
                if (m.winsPerCycle >= m.tradesPerCycle) { this.showNotification("Las ganadas deben ser menores que las operaciones por ciclo.", 'error'); return; }
            } else { // Masaniello Clásico
                const m = this.state.masaniello;
                m.takeProfit = parseFloat(this.ui.masaTakeProfit.value);
                m.earlyExitEnabled = this.ui.masaEarlyExit.checked;
                m.totalTrades = parseInt(this.ui.masanielloGroup.querySelector('#total-trades-masa').value);
                m.expectedWins = parseInt(this.ui.masanielloGroup.querySelector('#expected-wins').value);
                if (m.expectedWins >= m.totalTrades) { this.showNotification("Las ganadas esperadas deben ser menores que el total de operaciones.", 'error'); return; }
            }

            this.ui.scoreboard.classList.remove('hidden');
            this.ui.liveCard.classList.remove('hidden');
            this.ui.historyCard.classList.remove('hidden');
            this.ui.setupCard.classList.add('hidden');
            
            this.updateScoreboard();
            this.calculateNextInvestment();
            
            if (this.state.strategy === 'uas') {
                this.showNotification(`Iniciando sesión. Límite de Racha Negativa (ALTO) calculado en: ${this.state.uas.lossStreakLimit} pérdidas.`, 'info');
            }
        },
        calculateNextInvestment() {
            let investment = 0;
            const strategy = this.state.strategy;
            
            if (strategy === 'uas') {
                const uas = this.state.uas;
                const riskPercent = uas.riskPerTrade / 100;
                
                if (uas.phase === 'ACUMULACIÓN') { 
                    investment = this.state.currentBalance * riskPercent; 
                    
                } else if (uas.phase === 'RECUPERACIÓN') {
                    investment = (this.state.currentBalance * riskPercent) + (uas.lastLossAmount * 0.15);
                    
                } else { // WINNER
                    const profit = this.state.currentBalance - this.state.initialBalance;
                    investment = profit * 0.30;
                }
                
            } else { // Masaniello Clásico y PRO
                const m = strategy === 'masaniello_pro' ? this.state.masaniello_pro : this.state.masaniello;
                
                // 1. CÁLCULO BASE DE MASANIELLO
                const capitalBase = strategy === 'masaniello_pro' ? m.fixedRiskCapital : this.state.currentBalance;
                const wins = strategy === 'masaniello_pro' ? m.cycleWins : m.winsSoFar;
                const trades = strategy === 'masaniello_pro' ? m.cycleTrades : m.tradesDone;
                const expected = strategy === 'masaniello_pro' ? m.winsPerCycle : m.expectedWins;
                const total = strategy === 'masaniello_pro' ? m.tradesPerCycle : m.totalTrades;
                
                const masanielloInvestmentBase = this.math.calculateMasanielloInvestment(capitalBase, total - trades, expected - wins, 1 + this.state.payout);
                let investmentCalculated = masanielloInvestmentBase;

                // --- LÓGICA DE RECUPERACIÓN EN BLOQUE (ESTRATEGIA 3) ---
                if (strategy === 'masaniello') {
                    const maxRiskAllowed = this.state.currentBalance * 0.10;
                    
                    if (m.recoveryMode) {
                        const amountToRecover = m.currentLossStreakAmount;
                        
                        // Cálculo de Martingala Controlada: (Pérdidas + 10% extra) / Payout
                        let recoveryInvestment = (amountToRecover + (amountToRecover * 0.10)) / this.state.payout; 
                        
                        // La inversión es el mínimo entre el CÁLCULO DE RECUPERACIÓN y el límite del 10%
                        investmentCalculated = Math.min(recoveryInvestment, maxRiskAllowed);
                        
                    } else {
                        // Si no está en Martingala, usa el cálculo de Masaniello (limitado al 10% por si Masaniello pide un monto muy alto)
                        investmentCalculated = Math.min(masanielloInvestmentBase, maxRiskAllowed);
                    }
                }
                // --- FIN LÓGICA DE RECUPERACIÓN EN BLOQUE ---
                
                investment = investmentCalculated;
            }
            
            if (!this.ui.allowDecimals.checked) investment = Math.round(investment);
            investment = Math.max(1, investment);
            this.state.lastInvestment = Math.min(investment, this.state.currentBalance);
            this.updateLivePanel();
        },
        logResult(isWin) {
            this.toggleActionButtons(false);
            const investment = this.state.lastInvestment;
            const netResult = isWin ? investment * this.state.payout : -investment;
            this.state.currentBalance += netResult;
            if (!isWin && this.state.strategy === 'uas') { this.state.uas.lastLossAmount = investment; }
            const newHistoryEntry = { 
                op: this.state.operationNumber, investment, result: isWin ? 'WIN' : 'LOSS', netResult, 
                balance: this.state.currentBalance,
                phase: this.state.strategy === 'uas' ? this.state.uas.phase : null,
                cycle: this.state.strategy === 'masaniello_pro' ? this.state.masaniello_pro.currentCycle : null
            };
            this.state.history.push(newHistoryEntry);
            this.updateStrategyState(isWin);
            this.renderHistory();
            this.updateScoreboard();
            if (this.checkSessionEnd()) { this.endSession(); }
            else { this.state.operationNumber++; this.calculateNextInvestment(); }
        },
        updateStrategyState(isWin) {
            if (this.state.strategy === 'uas') {
                const uas = this.state.uas;
                if (isWin) {
                    uas.consecutiveLosses = 0;
                    if (uas.phase === 'ACUMULACIÓN' && this.state.currentBalance >= uas.winnerThreshold) { uas.phase = 'WINNER'; }
                    else if (uas.phase === 'RECUPERACIÓN') { uas.phase = this.state.currentBalance >= this.state.initialBalance ? 'ACUMULACIÓN' : 'RECUPERACIÓN'; }
                    else { uas.phase = 'ACUMULACIÓN'; }
                } else {
                    uas.consecutiveLosses++;
                    if (uas.phase === 'WINNER') { uas.phase = 'RECUPERACIÓN'; }
                    // Entra en RECUPERACIÓN si cae por debajo del balance inicial, incluso si estaba en ACUMULACIÓN
                    else if (this.state.currentBalance < this.state.initialBalance) { uas.phase = 'RECUPERACIÓN'; }
                    else { uas.phase = 'ACUMULACIÓN'; }
                }
            } else if (this.state.strategy === 'masaniello') {
                const m = this.state.masaniello;
                m.tradesDone++;
                if (isWin) {
                    m.winsSoFar++;
                    
                    if (m.recoveryMode) {
                        // Si gana en modo Martingala, reinicia la pérdida acumulada y sale del modo
                        m.currentLossStreakAmount = 0; 
                        m.recoveryMode = false;      
                    }
                    
                    m.lastLossAmount = 0;
                } else {
                    m.lastLossAmount = this.state.lastInvestment;
                    // Activa/mantiene el modo de recuperación solo si el balance cae por debajo del inicial
                    if (this.state.currentBalance < this.state.initialBalance) {
                         m.currentLossStreakAmount += this.state.lastInvestment;
                         m.recoveryMode = true; 
                    } else {
                         // Si pierde pero sigue en ganancia general, NO activa el modo de recuperación agresiva
                         m.currentLossStreakAmount = 0;
                         m.recoveryMode = false;
                    }
                }
            } else if (this.state.strategy === 'masaniello_pro') {
                this.state.masaniello_pro.cycleTrades++;
                if (isWin) this.state.masaniello_pro.cycleWins++;
            }
        },
        checkSessionEnd() {
            if (this.state.strategy === 'uas') {
                const uas = this.state.uas;
                if (this.state.currentBalance <= uas.stopLoss) {
                    this.showNotification('❌ Límite de Pérdida Alcanzado', 'error');
                    return true;
                }
                if (uas.consecutiveLosses >= uas.lossStreakLimit) {
                    this.showNotification(`🚨 Límite de Racha Negativa (${uas.lossStreakLimit}) Alcanzado. ¡ALTO!`, 'error');
                    return true;
                }
                if (this.state.currentBalance >= uas.takeProfit) {
                    this.showNotification('✅ ¡Meta de Ganancia Alcanzada!', 'success');
                    return true;
                }
            } else if (this.state.strategy === 'masaniello') {
                const m = this.state.masaniello;
                const remTrades = m.totalTrades - m.tradesDone;
                const remWins = m.expectedWins - m.winsSoFar;
                return (m.earlyExitEnabled && this.state.currentBalance >= m.takeProfit) || remWins <= 0 || remWins > remTrades || remTrades <= 0;
            } else if (this.state.strategy === 'masaniello_pro') {
                const m = this.state.masaniello_pro;
                const remTrades = m.tradesPerCycle - m.cycleTrades;
                const remWins = m.winsPerCycle - m.cycleWins;
                if (remWins <= 0) { // Ciclo Exitoso
                    if (m.currentCycle >= m.cyclesToComplete) return true;
                    this.handleCycleWin();
                    return false;
                }
                // Si no quedan operaciones pero sí quedan ganancias, la campaña falla
                if (remTrades <= 0 && remWins > 0) return true; 

                return false;
            }
            return this.state.currentBalance < 1;
        },
        handleCycleWin() {
            const m = this.state.masaniello_pro;
            this.showNotification(`¡CICLO ${m.currentCycle} COMPLETADO! Balance Base Actualizado.`, 'success');
            m.currentCycle++;
            m.cycleStartCapital = this.state.currentBalance;
            m.cycleTrades = 0;
            m.cycleWins = 0;
            setTimeout(() => { this.updateLivePanel(); this.calculateNextInvestment(); }, 2000);
        },
        endSession(isManual = false) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const profitLoss = this.state.currentBalance - this.state.initialBalance;
            const profitLossPercent = (this.state.initialBalance > 0) ? (profitLoss / this.state.initialBalance) * 100 : 0;
            let resultText;
            
            if (isManual) {
                resultText = '⏸️ Sesión Finalizada Manualmente';
            } else if (this.state.strategy === 'uas') {
                if (this.state.currentBalance >= this.state.uas.takeProfit) resultText = '✅ ¡Meta de Ganancia Alcanzada!';
                else if (this.state.currentBalance <= this.state.uas.stopLoss) resultText = '❌ Límite de Pérdida Alcanzado';
                else if (this.state.uas.consecutiveLosses >= this.state.uas.lossStreakLimit) resultText = '❌ Límite de Racha Negativa';
                else resultText = (this.state.currentBalance > this.state.initialBalance) ? 'Sesión en Ganancia' : 'Sesión en Pérdida';
            } else if (this.state.strategy === 'masaniello_pro') {
                const m = this.state.masaniello_pro;
                // Mensaje de éxito/falla de la campaña
                if (m.currentCycle > m.cyclesToComplete) resultText = '🏆 ¡CAMPAÑA MASANIELLO PRO EXITOSA!';
                else if (m.cycleTrades >= m.tradesPerCycle && m.cycleWins < m.winsPerCycle) resultText = `❌ Campaña Fallida en Ciclo ${m.currentCycle}`;
                else resultText = 'Sesión Finalizada';
            } else if (this.state.strategy === 'masaniello') {
                const m = this.state.masaniello;
                if (m.earlyExitEnabled && this.state.currentBalance >= m.takeProfit) resultText = '✅ ¡Salida Anticipada Exitosa!';
                else if (m.winsSoFar >= m.expectedWins) resultText = '✅ ¡Ciclo Masaniello Exitoso!';
                else resultText = '❌ Ciclo Masaniello Fallido';
            } else {
                resultText = (this.state.currentBalance > this.state.initialBalance) ? 'Sesión en Ganancia' : 'Sesión en Pérdida';
            }

            const resultColor = (this.state.currentBalance > this.state.initialBalance) ? 'var(--color-win)' : 'var(--color-loss)';
            this.ui.journalSummary.innerHTML = `<p style="font-size: 1.4em;"><strong>Resultado:</strong> <span style="color: ${resultColor};">${resultText}</span></p>
                <p>Balance Final: $${this.state.currentBalance.toFixed(2)}</p>
                <p>Ganancia/Pérdida: $${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%)</p>
                <p><strong>Operaciones Totales:</strong> ${this.state.history.length}</p>`;
            this.ui.dashboard.classList.add('hidden');
            this.ui.sessionEndModal.classList.remove('hidden');
        },
        renderHistory() {
            let tableHTML = `<table><thead><tr><th>Op#</th><th>Ciclo</th><th>Invertido</th><th>Resultado</th><th>G/P</th><th>Balance</th></tr></thead><tbody>`;
            for (const op of this.state.history) {
                const rowClass = op.result === 'WIN' ? 'win-row' : 'loss-row';
                const resultColor = op.netResult >= 0 ? 'var(--color-secondary)' : 'var(--color-loss)';
                const cycleText = op.cycle ? op.cycle : '-';
                historyTableHTML += `<tr class="${rowClass}"><td>${op.op}</td><td>${cycleText}</td><td>$${op.investment.toFixed(2)}</td><td>${op.result}</td><td style="color: ${resultColor}">$${op.netResult.toFixed(2)}</td><td>$${op.balance.toFixed(2)}</td></tr>`;
            }
            this.ui.tableContent.innerHTML = tableHTML + '</tbody></table>';
        },
        updateLivePanel() {
            let operationText = `OPERACIÓN #${this.state.operationNumber}`;
            if (this.state.strategy === 'uas') {
                const uas = this.state.uas;
                this.ui.phaseDisplay.innerText = `FASE: ${uas.phase}`;
                if (uas.phase === 'WINNER') this.ui.phaseDisplay.style.color = 'var(--color-secondary)';
                else if (uas.phase === 'RECUPERACIÓN') this.ui.phaseDisplay.style.color = 'var(--color-loss)';
                else this.ui.phaseDisplay.style.color = 'var(--color-warning)';
                
            } else if (this.state.strategy === 'masaniello') {
                const m = this.state.masaniello;
                // Muestra la advertencia de Martingala Controlada Activa
                this.ui.phaseDisplay.innerText = `GANADAS: ${m.winsSoFar} de ${m.expectedWins} ${m.recoveryMode ? ' | ⚠️ MARTINGALA ACTIVA' : ''}`;
                this.ui.phaseDisplay.style.color = 'var(--color-primary)';
            } else if (this.state.strategy === 'masaniello_pro') {
                const m = this.state.masaniello_pro;
                this.ui.phaseDisplay.innerText = `CICLO ${m.currentCycle} de ${m.cyclesToComplete} | GANADAS: ${m.cycleWins} de ${m.winsPerCycle}`;
                this.ui.phaseDisplay.style.color = 'var(--color-primary)';
                operationText = `Operación #${m.cycleTrades + 1} del ciclo`;
            }
            this.ui.operationLabel.innerText = operationText;
            this.ui.investmentAmount.innerText = `$${this.state.lastInvestment.toFixed(2)}`;
            this.toggleActionButtons(true);
        },
        updateScoreboard() {
            const initial = this.state.initialBalance, current = this.state.currentBalance, profit = current - initial;
            // Cálculo del porcentaje de G/P
            const profitPercent = initial > 0 ? (profit / initial) * 100 : 0;
            
            this.ui.sbInitial.textContent = `$${initial.toFixed(2)}`;
            this.ui.sbCurrent.textContent = `$${current.toFixed(2)}`;
            this.ui.sbProfit.textContent = `$${profit.toFixed(2)} `;
            this.ui.sbProfitPercent.textContent = `(${profitPercent.toFixed(2)}%)`;
            
            // Reinicia y aplica clases
            this.ui.sbProfit.className = 'value';
            this.ui.sbProfitPercent.className = 'value-percent'; 
            
            if (profit > 0) {
                this.ui.sbProfit.classList.add('positive'); 
                this.ui.sbProfitPercent.classList.add('positive');
            } else if (profit < 0) {
                this.ui.sbProfit.classList.add('negative'); 
                this.ui.sbProfitPercent.classList.add('negative');
            }

            this.ui.sbCurrent.className = 'value';
            if (current > initial) this.ui.sbCurrent.classList.add('positive'); else if (current < initial) this.ui.sbCurrent.classList.add('negative');
        },
        toggleActionButtons(enabled) {
            this.ui.winBtn.disabled = !enabled;
            this.ui.lossBtn.disabled = !enabled;
        },
        updateUI() {
            const strategy = this.ui.strategySelect.value;
            this.ui.uasGroup.classList.toggle('hidden', strategy !== 'uas');
            this.ui.masanielloGroup.classList.toggle('hidden', strategy !== 'masaniello');
            this.ui.masanielloProGroup.classList.toggle('hidden', strategy !== 'masaniello_pro');
            
            if (strategy === 'uas') {
                 this.ui.uasWinRateSetup.closest('.input-group').classList.remove('hidden'); 
            } else {
                 this.ui.uasWinRateSetup.closest('.input-group').classList.add('hidden');
            }
            
            const info = {
                'uas': { borderColor: 'var(--color-secondary)', title: '<strong>ESTRATEGIA 1: RIESGO INTELIGENTE</strong>', description: 'Plan de progreso con fases de acumulación, ganancia y recuperación. Se detiene automáticamente con la regla del 3%.', warning: 'El límite de racha se CALCULA automáticamente. Requiere que el servidor Python esté corriendo.' },
                'masaniello_pro': { borderColor: 'var(--color-primary)', title: '<strong>ESTRATEGIA 2: MASANIELLO SECCIONES</strong>', description: 'Encadena ciclos de Masaniello para un crecimiento exponencial. La inversión se limita a un capital de riesgo fijo, no al balance total.', warning: 'Alto riesgo. Un ciclo fallido termina la campaña.' },
                'masaniello': { borderColor: 'var(--color-primary)', title: '<strong>ESTRATEGIA 3: MASANIELLO BÁSICO</strong>', description: 'Cálculo de inversión conservador que activa la **Martingala Controlada** para recuperación rápida, solo cuando el balance cae por debajo del inicial. **RIESGO MÁXIMO DEL 10% POR OPERACIÓN**.', warning: 'Martingala Controlada: ¡La inversión aumentará considerablemente tras la pérdida para recuperar el capital! Opera con cautela.' }
            };
            this.ui.strategyInfoBox.style.borderColor = info[strategy].borderColor;
            this.ui.strategyInfoBox.innerHTML = `<p>${info[strategy].title}</p><p>${info[strategy].description}</p><p style="opacity: 0.8;">${info[strategy].warning}</p>`;
        }
    };
    window.App = App;
    App.init();
});
