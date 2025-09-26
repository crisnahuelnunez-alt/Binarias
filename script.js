document.addEventListener('DOMContentLoaded', () => {
    const App = {
        state: {
            currentUser: null, initialBalance: 0, currentBalance: 0, operationNumber: 1, lastInvestment: 0, history: [],
            strategy: 'uas', payout: 0.87,
            uas: { phase: 'ACUMULACIÓN', takeProfit: 0, stopLoss: 0, riskPerTrade: 5, lossStreakLimit: 4, consecutiveLosses: 0, winnerThreshold: 0, lastLossAmount: 0 },
            masaniello_pro: { cyclesToComplete: 3, winsPerCycle: 4, tradesPerCycle: 10, currentCycle: 1, cycleWins: 0, cycleTrades: 0, cycleStartCapital: 0 },
            masaniello: { totalTrades: 10, expectedWins: 4, winsSoFar: 0, tradesDone: 0, takeProfit: 50, earlyExitEnabled: true }
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
            masanielloProGroup: document.getElementById('masaniello-pro-group'),
            masaProCycles: document.getElementById('masa-pro-cycles'),
            masaProWins: document.getElementById('masa-pro-wins'),
            masaProTrades: document.getElementById('masa-pro-trades'),
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
            personalStatsPanel: document.getElementById('personal-stats-panel'),
            sessionEndModal: document.getElementById('session-end-modal'),
        },
        charts: { balanceChart: null, sessionPlChart: null },
        showNotification(message, type = 'info') {
            const container = document.getElementById('notification-container');
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            container.appendChild(notification);
            setTimeout(() => { notification.remove(); }, 4000);
        },
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
            } else { this._displayScreen('user'); }
            Chart.defaults.color = 'rgba(234, 234, 234, 0.8)';
            Chart.defaults.font.family = "'Inter', sans-serif";
            Chart.defaults.borderColor = 'rgba(0, 255, 255, 0.2)';
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
            if (screenName !== currentHash) { history.pushState({ screen: screenName }, '', `#${screenName}`); }
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
                elementToShow = this.ui.dashboard;
            }
            else if (screenName === 'history') { this.renderAllUserSessions(); elementToShow = this.ui.historyScreen; }
            else if (screenName === 'stats') { this.renderStatsPage(); elementToShow = this.ui.statsScreen; }
            if (elementToShow) {
                elementToShow.classList.remove('hidden');
                void elementToShow.offsetWidth;
                elementToShow.classList.add('fade-in');
            }
        },
        getLastBalance() { const sessions = this.loadUserSessions(); return sessions.length > 0 ? sessions[0].finalBalance : null; },
        loadUserSessions() { if (!this.state.currentUser) return []; return JSON.parse(localStorage.getItem(`tradingSessions_${this.state.currentUser}`)) || []; },
        saveUserSessions(sessions) { if (!this.state.currentUser) return; localStorage.setItem(`tradingSessions_${this.state.currentUser}`, JSON.stringify(sessions)); },
        saveSession() {
            const notes = this.ui.sessionNotes.value;
            const profitLoss = this.state.currentBalance - this.state.initialBalance;
            const sessionData = {
                date: new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }),
                initialBalance: this.state.initialBalance, finalBalance: this.state.currentBalance,
                profitLoss, history: this.state.history, notes
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
            if (sessions.length === 0) { container.innerHTML = '<p>No hay sesiones guardadas.</p>'; return; }
            container.innerHTML = '';
            sessions.forEach((session, index) => {
                const profitColor = session.profitLoss >= 0 ? 'var(--color-win)' : 'var(--color-loss)';
                let historyTableHTML = '<table><thead><tr><th>Op#</th><th>Ciclo</th><th>Invertido</th><th>Resultado</th><th>G/P</th><th>Balance</th></tr></thead><tbody>';
                if(session.history && session.history.length > 0) {
                    session.history.forEach(op => {
                        const rowClass = op.result === 'WIN' ? 'win-row' : 'loss-row';
                        const resultColor = op.netResult >= 0 ? 'var(--color-secondary)' : 'var(--color-loss)';
                        const cycleText = op.cycle ? op.cycle : '-';
                        historyTableHTML += `<tr class="${rowClass}"><td>${op.op}</td><td>${cycleText}</td><td>$${op.investment.toFixed(2)}</td><td>${op.result}</td><td style="color: ${resultColor}">$${op.netResult.toFixed(2)}</td><td>$${op.balance.toFixed(2)}</td></tr>`;
                    });
                } else {
                    historyTableHTML += `<tr><td colspan="6">No hay operaciones registradas en esta sesión.</td></tr>`;
                }
                historyTableHTML += '</tbody></table>';
                const sessionElement = document.createElement('details');
                sessionElement.className = 'session-details';
                sessionElement.innerHTML = `
                    <summary>
                        <div>
                            <span>${session.date}</span>
                            <span style="color: ${profitColor}; font-weight: 800; margin-left: 20px;">G/P: $${session.profitLoss.toFixed(2)}</span>
                        </div>
                        <button class="download-btn" data-session-index="${index}">Descargar Resumen</button>
                    </summary>
                    <div class="session-details-content">
                        <p><strong>Balance:</strong> $${session.initialBalance.toFixed(2)} ➔ $${session.finalBalance.toFixed(2)}</p>
                        ${historyTableHTML}
                        <p><strong>Notas:</strong></p>
                        <div class="session-notes">${session.notes || '<em>Sin notas.</em>'}</div>
                    </div>`;
                container.appendChild(sessionElement);
            });
            document.querySelectorAll('.download-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    event.preventDefault(); event.stopPropagation();
                    const sessionIndex = event.target.getAttribute('data-session-index');
                    this.generatePdfForSession(parseInt(sessionIndex));
                });
            });
        },
        generatePdfForSession(sessionIndex) {
            this.showNotification('Generando resumen PDF...', 'info');
            const sessions = this.loadUserSessions();
            const sessionData = sessions[sessionIndex];
            if (!sessionData || !sessionData.history) { this.showNotification('No hay datos de operaciones para generar el PDF.', 'error'); return; }
            const wins = sessionData.history.filter(op => op.result === 'WIN').length;
            const totalOps = sessionData.history.length;
            const winrate = totalOps > 0 ? (wins / totalOps) * 100 : 0;
            const isProfit = sessionData.profitLoss >= 0;
            document.getElementById('pdf-session-date').textContent = sessionData.date;
            document.getElementById('pdf-total-ops').textContent = totalOps;
            document.getElementById('pdf-winrate').textContent = `${winrate.toFixed(1)}%`;
            document.getElementById('pdf-initial-balance').textContent = `$${sessionData.initialBalance.toFixed(2)}`;
            document.getElementById('pdf-final-balance').textContent = `$${sessionData.finalBalance.toFixed(2)}`;
            document.getElementById('pdf-session-result').textContent = isProfit ? 'GANANCIA' : 'PÉRDIDA';
            document.getElementById('pdf-profit-loss').textContent = `${isProfit ? '+' : ''}$${sessionData.profitLoss.toFixed(2)}`;
            document.getElementById('pdf-session-id').textContent = `ID de Sesión: ${Math.floor(100000 + Math.random() * 900000)}`;
            const ticketElements = [document.getElementById('pdf-winrate'), document.getElementById('pdf-session-result'), document.getElementById('pdf-profit-loss')];
            ticketElements.forEach(el => { el.classList.remove('profit', 'loss'); el.classList.add(isProfit ? 'profit' : 'loss'); });
            const ticketElement = document.getElementById('pdf-ticket-template');
            html2canvas(ticketElement, { scale: 2, backgroundColor: "#0d1117" }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
                pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                pdf.save(`resumen-sesion-${sessionData.date.split(',')[0].replace(/\//g, '-')}.pdf`);
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
            const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
            this.ui.personalStatsPanel.innerHTML = `
                <div class="stats-item"><span class="stats-label">Total Sesiones</span><span class="stats-value">${totalSessions}</span></div>
                <div class="stats-item"><span class="stats-label">G/P Neto</span><span class="stats-value ${totalProfitLoss >= 0 ? 'positive' : 'negative'}">$${totalProfitLoss.toFixed(2)}</span></div>
                <div class="stats-item"><span class="stats-label">Tasa de Éxito</span><span class="stats-value ${winRate >= 50 ? 'positive' : 'negative'}">${winRate.toFixed(1)}%</span></div>
                <div class="stats-item"><span class="stats-label">Total Operaciones</span><span class="stats-value">${totalTrades}</span></div>
                <div class="stats-item"><span class="stats-label">Operaciones Ganadas</span><span class="stats-value positive">${totalWins}</span></div>
                <div class="stats-item"><span class="stats-label">Operaciones Perdidas</span><span class="stats-value negative">${totalLosses}</span></div>`;
        },
        renderStatsPage() {
            this.ui.statsScreen.innerHTML = `
                <div class="card">
                    <h2>Panel de Estadísticas</h2>
                    <div class="stats-highlight-grid">
                        <div class="stats-highlight-card"><span class="label">Win Rate General</span><span class="value" id="overall-winrate-value">0%</span><span class="date">Ratio de Aciertos</span></div>
                        <div class="stats-highlight-card"><span class="label">Racha Victorias</span><span class="value positive" id="longest-streak-value">0</span><span class="date">Operaciones</span></div>
                        <div class="stats-highlight-card"><span class="label">Racha Pérdidas</span><span class="value negative" id="longest-loss-streak-value">0</span><span class="date">Operaciones</span></div>
                        <div class="stats-highlight-card"><span class="label">Mejor Sesión (G/P)</span><span class="value positive" id="best-session-value">$0.00</span><span class="date" id="best-session-date">--/--/----</span></div>
                    </div>
                </div>
                <div class="card">
                    <h2>Salón de la Fama (Récords Semanales)</h2>
                    <div class="stats-highlight-grid">
                        <div class="stats-highlight-card"><span class="label">Mejor Semana (Ganancia)</span><span class="value positive" id="best-week-profit-value">$0.00</span><span class="date" id="best-week-profit-date">Semana --</span></div>
                        <div class="stats-highlight-card"><span class="label">Mejor Semana (Win Rate)</span><span class="value" id="best-week-winrate-value">0%</span><span class="date" id="best-week-winrate-date">Semana --</span></div>
                    </div>
                </div>
                <div class="card"><h2>Evolución del Capital</h2><canvas id="balance-chart"></canvas></div>
                <div class="card"><h2>Resultado por Sesión (Últimas 15)</h2><canvas id="session-pl-chart"></canvas></div>
                <div class="action-buttons"><button class="btn-secondary" id="back-to-menu-from-stats-btn">Volver al Menú</button></div>`;
            this.ui.backToMenuFromStatsBtn = document.getElementById('back-to-menu-from-stats-btn');
            this.ui.backToMenuFromStatsBtn.addEventListener('click', () => this.showScreen('main-menu'));
            const sessions = this.loadUserSessions().slice().reverse();
            if (!sessions || sessions.length === 0) {
                this.ui.statsScreen.querySelector('.card').innerHTML = `<h2>Panel de Estadísticas</h2><p>No hay datos suficientes. ¡Completa al menos una sesión!</p>`;
                return;
            }
            let bestSession = { profit: -Infinity, date: '' }, longestWinStreak = 0, currentWinStreak = 0, longestLossStreak = 0, currentLossStreak = 0, totalTrades = 0, totalWins = 0;
            sessions.forEach(session => {
                if (session.profitLoss > bestSession.profit) bestSession = { profit: session.profitLoss, date: session.date };
                if (session.history && session.history.length > 0) {
                    session.history.forEach(op => {
                        totalTrades++;
                        if (op.result === 'WIN') {
                            totalWins++; currentWinStreak++;
                            longestLossStreak = Math.max(longestLossStreak, currentLossStreak); currentLossStreak = 0;
                        } else {
                            currentLossStreak++;
                            longestWinStreak = Math.max(longestWinStreak, currentWinStreak); currentWinStreak = 0;
                        }
                    });
                }
            });
            longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
            longestLossStreak = Math.max(longestLossStreak, currentLossStreak);
            const overallWinRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
            document.getElementById('overall-winrate-value').textContent = `${overallWinRate.toFixed(1)}%`;
            document.getElementById('best-session-value').textContent = `$${bestSession.profit.toFixed(2)}`;
            document.getElementById('best-session-date').textContent = bestSession.date;
            document.getElementById('longest-streak-value').textContent = longestWinStreak;
            document.getElementById('longest-loss-streak-value').textContent = longestLossStreak;
            const weeklyStats = {};
            const getWeekNumber = d => {
                d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1) / 7)}`;
            };
            sessions.forEach(session => {
                const parts = session.date.match(/(\d+)/g);
                if (!parts || parts.length < 3) return;
                const sessionDate = new Date(parts[2], parts[1] - 1, parts[0]);
                const weekId = getWeekNumber(sessionDate);
                if (!weeklyStats[weekId]) weeklyStats[weekId] = { profit: 0, wins: 0, trades: 0 };
                weeklyStats[weekId].profit += session.profitLoss;
                if(session.history) {
                    weeklyStats[weekId].trades += session.history.length;
                    weeklyStats[weekId].wins += session.history.filter(op => op.result === 'WIN').length;
                }
            });
            let bestWeekProfit = { id: 'Semana --', value: -Infinity }, bestWeekWinRate = { id: 'Semana --', value: -1 };
            for (const weekId in weeklyStats) {
                if (weeklyStats[weekId].profit > bestWeekProfit.value) bestWeekProfit = { id: weekId.replace('-W', ' / Sem '), value: weeklyStats[weekId].profit };
                const weekWinRate = weeklyStats[weekId].trades > 0 ? (weeklyStats[weekId].wins / weeklyStats[weekId].trades) * 100 : 0;
                if (weekWinRate > bestWeekWinRate.value) bestWeekWinRate = { id: weekId.replace('-W', ' / Sem '), value: weekWinRate };
            }
            document.getElementById('best-week-profit-value').textContent = `$${bestWeekProfit.value.toFixed(2)}`;
            document.getElementById('best-week-profit-date').textContent = bestWeekProfit.id;
            document.getElementById('best-week-winrate-value').textContent = `${bestWeekWinRate.value.toFixed(1)}%`;
            document.getElementById('best-week-winrate-date').textContent = bestWeekWinRate.id;
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
                options: { scales: { y: { beginAtZero: false, ticks: { callback: (value) => `$${value}` } } } }
            });
        },
        renderSessionPLChart(labels, data) {
            const ctx = document.getElementById('session-pl-chart').getContext('2d');
            if (this.charts.sessionPlChart) this.charts.sessionPlChart.destroy();
            this.charts.sessionPlChart = new Chart(ctx, {
                type: 'bar',
                data: { labels, datasets: [{ label: 'Ganancia/Pérdida por Sesión', data, backgroundColor: data.map(v => v >= 0 ? 'rgba(57, 255, 20, 0.7)' : 'rgba(255, 45, 85, 0.7)'), borderColor: data.map(v => v >= 0 ? '#39FF14' : '#FF2D55'), borderWidth: 1 }] },
                options: { scales: { y: { beginAtZero: true, ticks: { callback: (value) => `$${value}` } } } }
            });
        },
        resetSessionState() {
            Object.assign(this.state, {
                initialBalance: 0, currentBalance: 0, operationNumber: 1, lastInvestment: 0, history: [],
                uas: { phase: 'ACUMULACIÓN', takeProfit: 0, stopLoss: 0, riskPerTrade: 5, lossStreakLimit: 4, consecutiveLosses: 0, winnerThreshold: 0, lastLossAmount: 0 },
                masaniello_pro: { cyclesToComplete: 3, winsPerCycle: 4, tradesPerCycle: 10, currentCycle: 1, cycleWins: 0, cycleTrades: 0, cycleStartCapital: 0 },
                masaniello: { totalTrades: 10, expectedWins: 4, winsSoFar: 0, tradesDone: 0, takeProfit: 50, earlyExitEnabled: true }
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
        startTrading() {
            const balance = parseFloat(this.ui.initialBalanceInput.value);
            if (!balance || balance <= 0) { this.showNotification("Introduce un capital inicial válido.", 'error'); return; }
            this.state.initialBalance = balance;
            this.state.currentBalance = balance;
            this.state.strategy = this.ui.strategySelect.value;
            this.state.payout = parseFloat(this.ui.payoutRateInput.value) / 100;
            if (this.state.strategy === 'uas') {
                this.state.uas.takeProfit = this.state.initialBalance * 1.20;
                this.state.uas.stopLoss = parseFloat(this.ui.uasStopLoss.value);
                this.state.uas.riskPerTrade = parseFloat(this.ui.uasRiskPercent.value);
                this.state.uas.lossStreakLimit = parseInt(this.ui.uasLossStreak.value);
                this.state.uas.winnerThreshold = this.state.initialBalance * 1.10;
                if (this.state.uas.stopLoss >= this.state.initialBalance) { this.showNotification("El límite de pérdida debe ser menor que tu capital inicial.", 'error'); return; }
            } else if (this.state.strategy === 'masaniello_pro') {
                const m = this.state.masaniello_pro;
                m.cyclesToComplete = parseInt(this.ui.masaProCycles.value);
                m.winsPerCycle = parseInt(this.ui.masaProWins.value);
                m.tradesPerCycle = parseInt(this.ui.masaProTrades.value);
                m.cycleStartCapital = balance;
                if (m.winsPerCycle >= m.tradesPerCycle) { this.showNotification("Las ganadas deben ser menores que las operaciones por ciclo.", 'error'); return; }
            } else {
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
        },
        calculateNextInvestment() {
            let investment = 0;
            const strategy = this.state.strategy;
            if (strategy === 'uas') {
                const uas = this.state.uas;
                if (uas.phase === 'ACUMULACIÓN') { investment = this.state.currentBalance * (uas.riskPerTrade / 100); }
                else if (uas.phase === 'RECUPERACIÓN') {
                    const baseInvestment = this.state.currentBalance * (uas.riskPerTrade / 100);
                    investment = baseInvestment + (uas.lastLossAmount * 0.33);
                } else {
                    const profit = this.state.currentBalance - this.state.initialBalance;
                    investment = profit * 0.30;
                }
            } else {
                const m = strategy === 'masaniello_pro' ? this.state.masaniello_pro : this.state.masaniello;
                const calculationCapital = strategy === 'masaniello_pro' ? m.cycleStartCapital : this.state.currentBalance;
                investment = this.math.calculateMasanielloInvestment(calculationCapital, (strategy === 'masaniello_pro' ? m.tradesPerCycle : m.totalTrades) - (strategy === 'masaniello_pro' ? m.cycleTrades : m.tradesDone), (strategy === 'masaniello_pro' ? m.winsPerCycle : m.expectedWins) - (strategy === 'masaniello_pro' ? m.cycleWins : m.winsSoFar), 1 + this.state.payout);
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
                    else if (uas.phase === 'RECUPERACIÓN') { uas.phase = this.state.currentBalance >= uas.winnerThreshold ? 'WINNER' : 'ACUMULACIÓN'; }
                } else {
                    uas.consecutiveLosses++;
                    if (uas.phase === 'WINNER') { uas.phase = 'RECUPERACIÓN'; }
                    else { uas.phase = 'ACUMULACIÓN'; }
                }
            } else if (this.state.strategy === 'masaniello') {
                this.state.masaniello.tradesDone++;
                if (isWin) this.state.masaniello.winsSoFar++;
            } else if (this.state.strategy === 'masaniello_pro') {
                this.state.masaniello_pro.cycleTrades++;
                if (isWin) this.state.masaniello_pro.cycleWins++;
            }
        },
        checkSessionEnd() {
            if (this.state.strategy === 'uas') {
                const uas = this.state.uas;
                return this.state.currentBalance >= uas.takeProfit || this.state.currentBalance <= uas.stopLoss || uas.consecutiveLosses >= uas.lossStreakLimit;
            } else if (this.state.strategy === 'masaniello') {
                const m = this.state.masaniello;
                const remTrades = m.totalTrades - m.tradesDone;
                const remWins = m.expectedWins - m.winsSoFar;
                return (m.earlyExitEnabled && this.state.currentBalance >= m.takeProfit) || remWins <= 0 || remWins > remTrades || remTrades <= 0;
            } else if (this.state.strategy === 'masaniello_pro') {
                const m = this.state.masaniello_pro;
                const remTrades = m.tradesPerCycle - m.cycleTrades;
                const remWins = m.winsPerCycle - m.cycleWins;
                if (remWins <= 0) {
                    if (m.currentCycle >= m.cyclesToComplete) return true;
                    this.handleCycleWin();
                    return false;
                }
                return remWins > remTrades || remTrades <= 0;
            }
            return this.state.currentBalance < 1;
        },
        handleCycleWin() {
            const m = this.state.masaniello_pro;
            this.showNotification(`¡CICLO ${m.currentCycle} COMPLETADO!`, 'success');
            m.currentCycle++;
            m.cycleStartCapital = this.state.currentBalance;
            m.cycleTrades = 0;
            m.cycleWins = 0;
            setTimeout(() => { this.updateLivePanel(); this.calculateNextInvestment(); }, 2000);
        },
        endSession() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const profitLoss = this.state.currentBalance - this.state.initialBalance;
            const profitLossPercent = (this.state.initialBalance > 0) ? (profitLoss / this.state.initialBalance) * 100 : 0;
            let resultText;
            if (this.state.strategy === 'uas') {
                if (this.state.currentBalance >= this.state.uas.takeProfit) resultText = '✅ ¡Meta de Ganancia Alcanzada!';
                else if (this.state.currentBalance <= this.state.uas.stopLoss) resultText = '❌ Límite de Pérdida Alcanzado';
                else if (this.state.uas.consecutiveLosses >= this.state.uas.lossStreakLimit) resultText = '❌ Límite de Racha Negativa';
            } else if (this.state.strategy === 'masaniello_pro') {
                const m = this.state.masaniello_pro;
                if (m.currentCycle > m.cyclesToComplete) resultText = '🏆 ¡CAMPAÑA MASANIELLO PRO EXITOSA!';
                else resultText = `❌ Campaña Fallida en Ciclo ${m.currentCycle}`;
            } else if (this.state.strategy === 'masaniello') {
                const m = this.state.masaniello;
                if (m.earlyExitEnabled && this.state.currentBalance >= m.takeProfit) resultText = '✅ ¡Salida Anticipada Exitosa!';
                else if (m.winsSoFar >= m.expectedWins) resultText = '✅ ¡Ciclo Masaniello Exitoso!';
                else resultText = '❌ Ciclo Masaniello Fallido';
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
            if (this.state.history && this.state.history.length > 0) {
                for (const op of this.state.history) {
                    const rowClass = op.result === 'WIN' ? 'win-row' : 'loss-row';
                    const resultColor = op.netResult >= 0 ? 'var(--color-secondary)' : 'var(--color-loss)';
                    const cycleText = op.cycle ? op.cycle : '-';
                    tableHTML += `<tr class="${rowClass}"><td>${op.op}</td><td>${cycleText}</td><td>$${op.investment.toFixed(2)}</td><td>${op.result}</td><td style="color: ${resultColor}">$${op.netResult.toFixed(2)}</td><td>$${op.balance.toFixed(2)}</td></tr>`;
                }
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
                this.ui.phaseDisplay.innerText = `GANADAS: ${m.winsSoFar} de ${m.expectedWins}`;
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
            this.ui.sbInitial.textContent = `$${initial.toFixed(2)}`;
            this.ui.sbCurrent.textContent = `$${current.toFixed(2)}`;
            this.ui.sbProfit.textContent = `$${profit.toFixed(2)}`;
            this.ui.sbProfit.className = 'value';
            if (profit > 0) this.ui.sbProfit.classList.add('positive'); else if (profit < 0) this.ui.sbProfit.classList.add('negative');
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
            const info = {
                'uas': { borderColor: 'var(--color-secondary)', title: '<strong>ESTRATEGIA UNIVERSAL DE ACUMULACIÓN (UAS)</strong>', description: 'Plan de progreso con fases de acumulación, ganancia y recuperación.', warning: 'Define tu riesgo y el sistema se adapta.' },
                'masaniello_pro': { borderColor: 'var(--color-primary)', title: '<strong>MASANIELLO PRO (Etapas)</strong>', description: 'Encadena ciclos de Masaniello para un crecimiento exponencial.', warning: 'Alto riesgo. Un ciclo fallido termina la campaña.' },
                'masaniello': { borderColor: 'var(--color-primary)', title: '<strong>MASANIELLO CLÁSICO</strong>', description: 'Calcula la inversión para un objetivo de aciertos fijos.', warning: 'Activa la Salida Anticipada para mayor seguridad.' }
            };
            this.ui.strategyInfoBox.style.borderColor = info[strategy].borderColor;
            this.ui.strategyInfoBox.innerHTML = `<p>${info[strategy].title}</p><p>${info[strategy].description}</p><p style="opacity: 0.8;">${info[strategy].warning}</p>`;
        }
    };
    window.App = App;
    App.init();
});
