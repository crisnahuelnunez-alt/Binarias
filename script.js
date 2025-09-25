document.addEventListener('DOMContentLoaded', () => {
    const App = {
        state: {
            currentUser: null, initialBalance: 0, currentBalance: 0, operationNumber: 1, lastInvestment: 0, history: [],
            strategy: 'gpa', payout: 0.87,
            gpa: { phase: 'DESPEGUE', takeProfit: 0, stopLoss: 0, riskPerTrade: 6, lossStreakLimit: 4, consecutiveLosses: 0, takeoffThreshold: 0, lastLossAmount: 0 },
            masaniello_pro: { cyclesToComplete: 3, winsPerCycle: 4, tradesPerCycle: 10, currentCycle: 1, cycleWins: 0, cycleTrades: 0, cycleStartCapital: 0 },
            masaniello: { totalTrades: 10, expectedWins: 4, winsSoFar: 0, tradesDone: 0, takeProfit: 50, earlyExitEnabled: true }
        },
        ui: {
            userScreen: document.getElementById('user-screen'),
            mainMenuScreen: document.getElementById('main-menu-screen'),
            dashboard: document.getElementById('dashboard'),
            historyScreen: document.getElementById('history-screen'),
            usernameInput: document.getElementById('username'),
            loginBtn: document.getElementById('login-btn'),
            logoutBtn: document.getElementById('logout-btn'),
            welcomeMessage: document.getElementById('welcome-message'),
            goToSessionBtn: document.getElementById('go-to-session-btn'),
            goToHistoryBtn: document.getElementById('go-to-history-btn'),
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
            gpaGroup: document.getElementById('gpa-group'),
            gpaStopLoss: document.getElementById('gpa-stop-loss'),
            gpaRiskPercent: document.getElementById('gpa-risk-percent'),
            gpaLossStreak: document.getElementById('gpa-loss-streak'),
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
            sessionNotes: document.getElementById('session-notes'),
            savedSessionsList: document.getElementById('saved-sessions-list'),
            backToMenuFromHistoryBtn: document.getElementById('back-to-menu-from-history-btn'),
            scoreboard: document.getElementById('scoreboard'),
            sbInitial: document.getElementById('sb-initial'),
            sbCurrent: document.getElementById('sb-current'),
            sbProfit: document.getElementById('sb-profit'),
            personalStatsPanel: document.getElementById('personal-stats-panel'),
            sessionEndModal: document.getElementById('session-end-modal'),
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
            } else {
                this._displayScreen('user');
            }
        },
        
        bindEvents() {
            this.ui.loginBtn.addEventListener('click', () => this.login());
            this.ui.logoutBtn.addEventListener('click', () => this.logout());
            this.ui.goToSessionBtn.addEventListener('click', () => this.showScreen('dashboard-setup'));
            this.ui.goToHistoryBtn.addEventListener('click', () => this.showScreen('history'));
            this.ui.startBtn.addEventListener('click', () => this.startTrading());
            this.ui.winBtn.addEventListener('click', () => this.logResult(true));
            this.ui.lossBtn.addEventListener('click', () => this.logResult(false));
            this.ui.strategySelect.addEventListener('change', () => this.updateUI());
            this.ui.backToMenuBtn.addEventListener('click', () => this.showScreen('main-menu'));
            this.ui.saveSessionBtn.addEventListener('click', () => this.saveSession());
            this.ui.backToMenuFromHistoryBtn.addEventListener('click', () => this.showScreen('main-menu'));
            
            window.addEventListener('popstate', (event) => {
                const loggedInUser = sessionStorage.getItem('currentUser');
                if (!loggedInUser) { this._displayScreen('user'); return; }
                if (event.state && event.state.screen) { this._displayScreen(event.state.screen); } 
                else { this._displayScreen('main-menu'); }
            });
        },
        
        login() {
            const username = this.ui.usernameInput.value.trim();
            if (!username) { alert('Por favor, ingresa un nombre de usuario.'); return; }
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
            this.ui.sessionEndModal.classList.add('hidden');
            
            let elementToShow;
            if (screenName === 'user') {
                elementToShow = this.ui.userScreen;
            } else if (screenName === 'main-menu') {
                elementToShow = this.ui.mainMenuScreen;
            } else if (screenName === 'dashboard-setup') {
                this.resetSessionState();
                const lastBalance = this.getLastBalance();
                this.ui.initialBalanceInput.value = lastBalance ? lastBalance.toFixed(2) : '';
                this.ui.gpaStopLoss.value = lastBalance ? (lastBalance * 0.8).toFixed(0) : '20';
                elementToShow = this.ui.dashboard;
            } else if (screenName === 'history') {
                this.renderAllUserSessions();
                elementToShow = this.ui.historyScreen;
            }

            if (elementToShow) {
                elementToShow.classList.remove('hidden');
                void elementToShow.offsetWidth;
                elementToShow.classList.add('fade-in');
            }
        },
        
        getLastBalance() {
            const sessions = this.loadUserSessions();
            if (sessions.length > 0) {
                return sessions[0].finalBalance;
            }
            return null;
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
            let totalSessions = sessions.length; let totalProfitLoss = 0; let totalTrades = 0; let totalWins = 0;
            sessions.forEach(session => {
                totalProfitLoss += session.profitLoss;
                session.history.forEach(op => {
                    totalTrades++;
                    if (op.result === 'WIN') totalWins++;
                });
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

        resetSessionState() {
            Object.assign(this.state, {
                initialBalance: 0, currentBalance: 0, operationNumber: 1, lastInvestment: 0, history: [],
                gpa: { phase: 'DESPEGUE', takeProfit: 0, stopLoss: 0, riskPerTrade: 6, lossStreakLimit: 4, consecutiveLosses: 0, takeoffThreshold: 0, lastLossAmount: 0 },
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
            if (!balance || balance <= 0) { alert("Introduce un capital inicial válido."); return; }
            
            this.state.initialBalance = balance;
            this.state.currentBalance = balance;
            this.state.strategy = this.ui.strategySelect.value;
            this.state.payout = parseFloat(this.ui.payoutRateInput.value) / 100;

            if (this.state.strategy === 'gpa') {
                this.state.gpa.takeProfit = this.state.initialBalance * 1.20;
                this.state.gpa.stopLoss = parseFloat(this.ui.gpaStopLoss.value);
                this.state.gpa.riskPerTrade = parseFloat(this.ui.gpaRiskPercent.value);
                this.state.gpa.lossStreakLimit = parseInt(this.ui.gpaLossStreak.value);
                this.state.gpa.takeoffThreshold = this.state.initialBalance * 1.10;
                if (this.state.gpa.stopLoss >= this.state.initialBalance) { alert("El límite de pérdida debe ser menor que tu capital inicial."); return; }
            } else if (this.state.strategy === 'masaniello_pro') {
                const m = this.state.masaniello_pro;
                m.cyclesToComplete = parseInt(this.ui.masaProCycles.value);
                m.winsPerCycle = parseInt(this.ui.masaProWins.value);
                m.tradesPerCycle = parseInt(this.ui.masaProTrades.value);
                m.cycleStartCapital = balance;
                if (m.winsPerCycle >= m.tradesPerCycle) { alert("Las ganadas por ciclo deben ser menores que las operaciones por ciclo."); return; }
            } else { // Masaniello Clásico
                const m = this.state.masaniello;
                m.takeProfit = parseFloat(this.ui.masaTakeProfit.value);
                m.earlyExitEnabled = this.ui.masaEarlyExit.checked;
                m.totalTrades = parseInt(this.ui.masanielloGroup.querySelector('#total-trades-masa').value);
                m.expectedWins = parseInt(this.ui.masanielloGroup.querySelector('#expected-wins').value);
                if (m.expectedWins >= m.totalTrades) { alert("Las ganadas esperadas deben ser menores que el total de operaciones."); return; }
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
            if (strategy === 'gpa') {
                const gpa = this.state.gpa;
                if (gpa.phase === 'DESPEGUE') {
                    investment = this.state.currentBalance * (gpa.riskPerTrade / 100);
                } else if (gpa.phase === 'RECUPERACION') {
                    const baseInvestment = this.state.currentBalance * (gpa.riskPerTrade / 100);
                    investment = baseInvestment + (gpa.lastLossAmount * 0.33);
                } else { // CRUCERO
                    const profit = this.state.currentBalance - this.state.initialBalance;
                    investment = profit * 0.30;
                }
            } else { // Masaniello Clásico y PRO
                const m = strategy === 'masaniello_pro' ? this.state.masaniello_pro : this.state.masaniello;
                const capital = strategy === 'masaniello_pro' ? m.cycleStartCapital : this.state.currentBalance;
                const wins = strategy === 'masaniello_pro' ? m.cycleWins : m.winsSoFar;
                const trades = strategy === 'masaniello_pro' ? m.cycleTrades : m.tradesDone;
                const expected = strategy === 'masaniello_pro' ? m.winsPerCycle : m.expectedWins;
                const total = strategy === 'masaniello_pro' ? m.tradesPerCycle : m.totalTrades;
                
                // CORRECCIÓN: El capital para el cálculo debe ser el del inicio del ciclo en PRO
                const calculationCapital = strategy === 'masaniello_pro' ? m.cycleStartCapital : this.state.currentBalance;
                investment = this.math.calculateMasanielloInvestment(calculationCapital, total - trades, expected - wins, 1 + this.state.payout);
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
            if (!isWin && this.state.strategy === 'gpa') { this.state.gpa.lastLossAmount = investment; }

            const newHistoryEntry = { 
                op: this.state.operationNumber, investment, result: isWin ? 'WIN' : 'LOSS', netResult, 
                balance: this.state.currentBalance,
                phase: this.state.strategy === 'gpa' ? this.state.gpa.phase : null,
                cycle: this.state.strategy === 'masaniello_pro' ? this.state.masaniello_pro.currentCycle : null
            };
            this.state.history.push(newHistoryEntry);
            
            this.updateStrategyState(isWin);
            this.renderHistory();
            this.updateScoreboard();
            
            if (this.checkSessionEnd()) this.endSession();
            else {
                this.state.operationNumber++; 
                this.calculateNextInvestment();
            }
        },

        updateStrategyState(isWin) {
            if (this.state.strategy === 'gpa') {
                const gpa = this.state.gpa;
                if (isWin) {
                    gpa.consecutiveLosses = 0;
                    if (gpa.phase === 'DESPEGUE' && this.state.currentBalance >= gpa.takeoffThreshold) gpa.phase = 'CRUCERO';
                    else if (gpa.phase === 'RECUPERACION') gpa.phase = 'CRUCERO';
                } else {
                    gpa.consecutiveLosses++;
                    if (gpa.phase === 'CRUCERO') gpa.phase = 'RECUPERACION';
                    else gpa.phase = 'DESPEGUE';
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
            if (this.state.strategy === 'gpa') {
                const gpa = this.state.gpa;
                if (this.state.currentBalance >= gpa.takeProfit) return true;
                if (this.state.currentBalance <= gpa.stopLoss) return true;
                if (gpa.consecutiveLosses >= gpa.lossStreakLimit) return true;
            } else if (this.state.strategy === 'masaniello') {
                const m = this.state.masaniello;
                if (m.earlyExitEnabled && this.state.currentBalance >= m.takeProfit) return true;
                const remTrades = m.totalTrades - m.tradesDone;
                const remWins = m.expectedWins - m.winsSoFar;
                if (remWins <= 0 || remWins > remTrades || remTrades <= 0) return true;
            } else if (this.state.strategy === 'masaniello_pro') {
                const m = this.state.masaniello_pro;
                const remTrades = m.tradesPerCycle - m.cycleTrades;
                const remWins = m.winsPerCycle - m.cycleWins;
                if (remWins <= 0) {
                    if (m.currentCycle >= m.cyclesToComplete) return true;
                    this.handleCycleWin();
                    return false;
                }
                if (remWins > remTrades || remTrades <= 0) return true;
            }
            if (this.state.currentBalance < 1) return true;
            return false;
        },

        handleCycleWin() {
            const m = this.state.masaniello_pro;
            this.ui.phaseDisplay.innerText = `¡CICLO ${m.currentCycle} COMPLETADO!`;
            this.ui.phaseDisplay.style.color = 'var(--color-win)';
            m.currentCycle++;
            m.cycleStartCapital = this.state.currentBalance;
            m.cycleTrades = 0;
            m.cycleWins = 0;
            setTimeout(() => {
                this.updateLivePanel();
                this.calculateNextInvestment();
            }, 2000);
        },

        endSession() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const profitLoss = this.state.currentBalance - this.state.initialBalance;
            const profitLossPercent = (this.state.initialBalance > 0) ? (profitLoss / this.state.initialBalance) * 100 : 0;
            let resultText = this.state.currentBalance > this.state.initialBalance ? 'Sesión en Ganancia' : 'Sesión en Pérdida';
            
            if (this.state.strategy === 'gpa') {
                if (this.state.currentBalance >= this.state.gpa.takeProfit) resultText = '✅ ¡Meta Automática Alcanzada!';
                else if (this.state.currentBalance <= this.state.gpa.stopLoss) resultText = '❌ Límite de Pérdida Alcanzado';
                else if (this.state.gpa.consecutiveLosses >= this.state.gpa.lossStreakLimit) resultText = '❌ Límite de Racha Negativa';
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
            for (const op of this.state.history) {
                const rowClass = op.result === 'WIN' ? 'win-row' : 'loss-row';
                const resultColor = op.netResult >= 0 ? 'var(--color-secondary)' : 'var(--color-loss)';
                const cycleText = op.cycle ? op.cycle : '-';
                tableHTML += `<tr class="${rowClass}"><td>${op.op}</td><td>${cycleText}</td><td>$${op.investment.toFixed(2)}</td><td>${op.result}</td><td style="color: ${resultColor}">$${op.netResult.toFixed(2)}</td><td>$${op.balance.toFixed(2)}</td></tr>`;
            }
            this.ui.tableContent.innerHTML = tableHTML + '</tbody></table>';
        },
        
        updateLivePanel() {
            let operationText = `OPERACIÓN #${this.state.operationNumber}`;
            if (this.state.strategy === 'gpa') {
                const gpa = this.state.gpa;
                this.ui.phaseDisplay.innerText = `FASE: ${gpa.phase}`;
                if (gpa.phase === 'CRUCERO') this.ui.phaseDisplay.style.color = 'var(--color-secondary)';
                else if (gpa.phase === 'RECUPERACION') this.ui.phaseDisplay.style.color = 'var(--color-loss)';
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
            const initial = this.state.initialBalance;
            const current = this.state.currentBalance;
            const profit = current - initial;
            this.ui.sbInitial.textContent = `$${initial.toFixed(2)}`;
            this.ui.sbCurrent.textContent = `$${current.toFixed(2)}`;
            this.ui.sbProfit.textContent = `$${profit.toFixed(2)}`;
            this.ui.sbProfit.className = 'value';
            if (profit > 0) this.ui.sbProfit.classList.add('positive');
            else if (profit < 0) this.ui.sbProfit.classList.add('negative');
            this.ui.sbCurrent.className = 'value';
            if (current > initial) this.ui.sbCurrent.classList.add('positive');
            else if (current < initial) this.ui.sbCurrent.classList.add('negative');
        },

        toggleActionButtons(enabled) {
            this.ui.winBtn.disabled = !enabled;
            this.ui.lossBtn.disabled = !enabled;
        },
        
        updateUI() {
            const strategy = this.ui.strategySelect.value;
            this.ui.gpaGroup.classList.toggle('hidden', strategy !== 'gpa');
            this.ui.masanielloGroup.classList.toggle('hidden', strategy !== 'masaniello');
            this.ui.masanielloProGroup.classList.toggle('hidden', strategy !== 'masaniello_pro');
            
            const info = {
                'gpa': { borderColor: 'var(--color-secondary)', title: '<strong>GESTION PRO DE ACUMULACION</strong>', description: 'Plan de progreso con meta diaria automática y recuperación activa.', warning: 'Define tu riesgo y el sistema se adapta.' },
                'masaniello_pro': { borderColor: 'var(--color-primary)', title: '<strong>MASANIELLO PRO (Etapas)</strong>', description: 'Encadena ciclos de Masaniello para un crecimiento exponencial.', warning: 'Alto riesgo. Un ciclo fallido termina la campaña.' },
                'masaniello': { borderColor: 'var(--color-primary)', title: '<strong>Riesgo Calculado (Clásico)</strong>', description: 'Calcula la inversión para un objetivo de aciertos fijos.', warning: 'Activa la Salida Anticipada para mayor seguridad.' }
            };
            this.ui.strategyInfoBox.style.borderColor = info[strategy].borderColor;
            this.ui.strategyInfoBox.innerHTML = `<p>${info[strategy].title}</p><p>${info[strategy].description}</p><p style="opacity: 0.8;">${info[strategy].warning}</p>`;
        }
    };
    
    App.init();
});
