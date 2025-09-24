document.addEventListener('DOMContentLoaded', () => {
    const App = {
        state: {},
        ui: {
            welcomeScreen: document.getElementById('welcome-screen'),
            dashboard: document.getElementById('dashboard'),
            historyScreen: document.getElementById('history-screen'),
            setupCard: document.getElementById('setup-card'),
            liveCard: document.getElementById('live-card'),
            historyCard: document.getElementById('history-card'),
            journalCard: document.getElementById('journal-card'),
            startSessionBtn: document.getElementById('start-session-btn'),
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
            masanielloGroup: document.getElementById('masaniello-group'),
            gemhuelGroup: document.getElementById('gemhuel-group'),
            allowDecimals: document.getElementById('allowDecimals'),
            payoutRateInput: document.getElementById('payoutRate'),
            phaseDisplay: document.getElementById('phase-display'),
            backToWelcomeBtn: document.getElementById('backToWelcomeBtn'),
            sessionNotes: document.getElementById('session-notes'),
            viewHistoryBtn: document.getElementById('view-history-btn'),
            savedSessionsList: document.getElementById('saved-sessions-list'),
            backToWelcomeFromHistoryBtn: document.getElementById('back-to-welcome-from-history-btn'),
            scoreboard: document.getElementById('scoreboard'),
            sbInitial: document.getElementById('sb-initial'),
            sbCurrent: document.getElementById('sb-current'),
            sbProfit: document.getElementById('sb-profit'),
        },

        math: {
            combinations(n, k) { if (k < 0 || k > n) return 0; if (k === 0 || k === n) return 1; if (k > n / 2) k = n - k; let r = 1; for (let i = 1; i <= k; i++) { r = r * (n - i + 1) / i; } return r; },
            calculateMasanielloInvestment(K, N, E, Q) { let C = 1, T = 0, Ev = 0; if (N <= 0 || E <= 0 || E > N) return K; for (let i = 0; i <= N - E; i++) { Ev = E + i; T += this.combinations(Ev - 1, E - 1) * Math.pow(Q - 1, E) * Math.pow(1, i); } C = T / Math.pow(Q, N); if (C >= 1) return K; return (K * C) / (1 - C); }
        },

        init() {
            this.resetApp();
            this.bindEvents();
            this.updateUI();
        },
        
        resetState() {
            this.state = {
                initialBalance: 0, currentBalance: 0, operationNumber: 1, lastInvestment: 0, history: [],
                strategy: 'gemhuel', payout: 0.87,
                gemhuel: { phase: 'Acumulación', accumulationGoal: 0, profitForAttack: 0, attackTradesCount: 0, attackInvestment: 0, accumulationInvestment: 0, attackTrades: 3 },
                masaniello: { totalTrades: 10, expectedWins: 4, winsSoFar: 0, tradesDone: 0 }
            };
        },

        bindEvents() {
            this.ui.startSessionBtn.addEventListener('click', () => this.initSession());
            this.ui.startBtn.addEventListener('click', () => this.startTrading());
            this.ui.winBtn.addEventListener('click', () => this.logResult(true));
            this.ui.lossBtn.addEventListener('click', () => this.logResult(false));
            this.ui.strategySelect.addEventListener('change', () => this.updateUI());
            this.ui.backToWelcomeBtn.addEventListener('click', () => this.resetApp());
            this.ui.saveSessionBtn.addEventListener('click', () => this.saveSession());
            this.ui.viewHistoryBtn.addEventListener('click', () => this.showHistoryScreen());
            this.ui.backToWelcomeFromHistoryBtn.addEventListener('click', () => this.resetApp());
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
            let savedSessions = JSON.parse(localStorage.getItem('tradingSessions')) || [];
            savedSessions.unshift(sessionData);
            localStorage.setItem('tradingSessions', JSON.stringify(savedSessions));
            alert('¡Sesión guardada con éxito!');
            this.resetApp();
        },

        showHistoryScreen() {
            this.ui.welcomeScreen.classList.add('hidden');
            this.ui.historyScreen.classList.remove('hidden');
            const sessions = JSON.parse(localStorage.getItem('tradingSessions')) || [];
            const container = this.ui.savedSessionsList;
            if (sessions.length === 0) {
                container.innerHTML = '<p>No hay sesiones guardadas todavía.</p>';
                return;
            }
            container.innerHTML = '';
            sessions.forEach((session) => {
                const profitColor = session.profitLoss >= 0 ? 'var(--color-win)' : 'var(--color-loss)';
                let historyTableHTML = '<table><thead><tr><th>Op#</th><th>Invertido</th><th>Resultado</th><th>G/P</th><th>Balance</th></tr></thead><tbody>';
                session.history.forEach(op => {
                     const rowClass = op.result === 'WIN' ? 'win-row' : 'loss-row';
                     const resultColor = op.netResult >= 0 ? 'var(--color-secondary)' : 'var(--color-loss)';
                     historyTableHTML += `<tr class="${rowClass}"><td>${op.op}</td><td>$${op.investment.toFixed(2)}</td><td>${op.result}</td><td style="color: ${resultColor}">$${op.netResult.toFixed(2)}</td><td>$${op.balance.toFixed(2)}</td></tr>`;
                });
                historyTableHTML += '</tbody></table>';
                const sessionElement = document.createElement('details');
                sessionElement.className = 'session-details';
                sessionElement.innerHTML = `
                    <summary>
                        <span>${session.date}</span>
                        <span style="color: ${profitColor}; font-weight: 800;">G/P: $${session.profitLoss.toFixed(2)}</span>
                    </summary>
                    <div class="session-details-content">
                        <p><strong>Balance:</strong> $${session.initialBalance.toFixed(2)} ➔ $${session.finalBalance.toFixed(2)}</p>
                        ${historyTableHTML}
                        <p><strong>Notas:</strong></p>
                        <div class="session-notes">${session.notes || '<em>Sin notas.</em>'}</div>
                    </div>`;
                container.appendChild(sessionElement);
            });
        },
        
        resetApp() {
            this.resetState();
            this.ui.welcomeScreen.classList.remove('hidden');
            this.ui.dashboard.classList.add('hidden');
            this.ui.historyScreen.classList.add('hidden');
            this.ui.scoreboard.classList.add('hidden');
            this.ui.setupCard.classList.remove('hidden');
            this.ui.liveCard.classList.add('hidden');
            this.ui.historyCard.classList.add('hidden');
            this.ui.journalCard.classList.add('hidden');
            this.ui.initialBalanceInput.value = '';
            this.ui.tableContent.innerHTML = '';
            this.ui.sessionNotes.value = '';
            this.updateUI();
        },

        initSession() {
            const balance = parseFloat(this.ui.initialBalanceInput.value);
            if (balance > 0) {
                this.resetState();
                this.state.initialBalance = balance;
                this.state.currentBalance = balance;
                this.ui.dashboard.classList.remove('hidden');
                this.ui.welcomeScreen.classList.add('hidden');
                this.ui.scoreboard.classList.remove('hidden');
                this.updateScoreboard();
            } else { alert("Introduce un capital inicial válido."); }
        },

        startTrading() {
            this.state.strategy = this.ui.strategySelect.value;
            this.state.payout = parseFloat(this.ui.payoutRateInput.value) / 100;
            if (this.state.strategy === 'masaniello') {
                this.state.masaniello.totalTrades = parseInt(document.getElementById('total-trades-masa').value);
                this.state.masaniello.expectedWins = parseInt(document.getElementById('expected-wins').value);
                if (this.state.masaniello.expectedWins >= this.state.masaniello.totalTrades) {
                    alert("El número de ganadas esperadas debe ser menor que el total de operaciones.");
                    return;
                }
            } else {
                const accumulationInvestmentPercent = parseFloat(document.getElementById('accumulation-investment-percent').value);
                const accumulationGoalPercent = parseFloat(document.getElementById('accumulation-goal-percent').value);
                this.state.gemhuel.accumulationInvestment = this.state.initialBalance * (accumulationInvestmentPercent / 100);
                this.state.gemhuel.accumulationGoal = this.state.initialBalance * (1 + accumulationGoalPercent / 100);
                this.state.gemhuel.attackTrades = parseInt(document.getElementById('attack-trades').value);
            }
            this.ui.liveCard.classList.remove('hidden');
            this.ui.historyCard.classList.remove('hidden');
            this.ui.setupCard.classList.add('hidden');
            this.calculateNextInvestment();
        },

        calculateNextInvestment() {
            let investment = 0;
            if (this.state.strategy === 'gemhuel') {
                const g = this.state.gemhuel;
                investment = (g.phase === 'Acumulación') ? g.accumulationInvestment : g.attackInvestment;
            } else {
                const m = this.state.masaniello;
                const payoutMasa = 1 + this.state.payout;
                const remainingTrades = m.totalTrades - m.tradesDone;
                const remainingWins = m.expectedWins - m.winsSoFar;
                investment = this.math.calculateMasanielloInvestment(this.state.currentBalance, remainingTrades, remainingWins, payoutMasa);
            }
            if (!this.ui.allowDecimals.checked) investment = Math.round(investment);
            this.state.lastInvestment = (investment > this.state.currentBalance || investment <= 0) ? this.state.currentBalance : investment;
            if(this.state.lastInvestment < 1 && this.state.currentBalance > 1) this.state.lastInvestment = 1;
            this.updateLivePanel();
        },
        
        logResult(isWin) {
            this.toggleActionButtons(false);
            const investment = this.state.lastInvestment;
            const netResult = isWin ? investment * this.state.payout : -investment;
            this.state.currentBalance += netResult;
            this.state.history.push({ op: this.state.operationNumber, investment, result: isWin ? 'WIN' : 'LOSS', netResult, balance: this.state.currentBalance });
            this.updateStrategyState(isWin);
            this.renderHistory();
            this.updateScoreboard();
            if (this.checkSessionEnd()) {
                this.endSession();
            } else {
                this.state.operationNumber++; 
                this.calculateNextInvestment();
                this.toggleActionButtons(true);
            }
        },

        updateStrategyState(isWin) {
            if (this.state.strategy === 'gemhuel') {
                const g = this.state.gemhuel;
                if (g.phase === 'Acumulación' && this.state.currentBalance >= g.accumulationGoal) {
                    g.phase = 'Ataque';
                    g.profitForAttack = this.state.currentBalance - this.state.initialBalance;
                    g.attackInvestment = g.profitForAttack / g.attackTrades;
                    g.attackTradesCount = 0;
                } else if (g.phase === 'Ataque') {
                    g.attackTradesCount++;
                    if (!isWin || g.attackTradesCount >= g.attackTrades) g.phase = 'Acumulación';
                }
            } else {
                this.state.masaniello.tradesDone++;
                if (isWin) this.state.masaniello.winsSoFar++;
            }
        },

        checkSessionEnd() {
            if (this.state.currentBalance <= 0) return true;
            if (this.state.strategy === 'masaniello') {
                const m = this.state.masaniello;
                const remTrades = m.totalTrades - m.tradesDone;
                const remWins = m.expectedWins - m.winsSoFar;
                if (remWins <= 0 || remWins > remTrades || m.tradesDone >= m.totalTrades) return true;
            }
            if (this.state.lastInvestment <= 0 && this.state.operationNumber > 1) return true;
            return false;
        },

        endSession() {
            const profitLoss = this.state.currentBalance - this.state.initialBalance;
            const profitLossPercent = (this.state.initialBalance > 0) ? (profitLoss / this.state.initialBalance) * 100 : 0;
            let resultText = this.state.currentBalance > this.state.initialBalance ? 'Sesión en Ganancia' : 'Sesión en Pérdida';
            if(this.state.strategy === 'masaniello') {
                resultText = this.state.masaniello.winsSoFar >= this.state.masaniello.expectedWins ? '✅ ¡Ciclo Masaniello Exitoso!' : '❌ Ciclo Masaniello Fallido';
            }
            const resultColor = (resultText.includes('Exitoso') || resultText.includes('Ganancia')) ? 'var(--color-win)' : 'var(--color-loss)';
            this.ui.journalSummary.innerHTML = `<p style="font-size: 1.4em;"><strong>Resultado:</strong> <span style="color: ${resultColor};">${resultText}</span></p>
                                           <p>Balance Final: $${this.state.currentBalance.toFixed(2)}</p>
                                           <p>Ganancia/Pérdida: $${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%)</p>
                                           <p><strong>Operaciones Totales:</strong> ${this.state.history.length}</p>`;
            this.ui.liveCard.classList.add('hidden');
            this.ui.historyCard.classList.remove('hidden'); 
            this.ui.journalCard.classList.remove('hidden');
        },

        renderHistory() {
            let tableHTML = `<table><thead><tr><th>Op#</th><th>Invertido</th><th>Resultado</th><th>G/P</th><th>Balance</th></tr></thead><tbody>`;
            for (const op of this.state.history) {
                const rowClass = op.result === 'WIN' ? 'win-row' : 'loss-row';
                const resultColor = op.netResult >= 0 ? 'var(--color-secondary)' : 'var(--color-loss)';
                tableHTML += `<tr class="${rowClass}"><td>${op.op}</td><td>$${op.investment.toFixed(2)}</td><td>${op.result}</td><td style="color: ${resultColor}">$${op.netResult.toFixed(2)}</td><td>$${op.balance.toFixed(2)}</td></tr>`;
            }
            this.ui.tableContent.innerHTML = tableHTML + '</tbody></table>';
        },
        
        updateLivePanel() {
            let totalOps = "∞";
            if (this.state.strategy === 'masaniello') totalOps = this.state.masaniello.totalTrades;
            this.ui.operationLabel.innerText = `OPERACIÓN #${this.state.operationNumber}`;
            if (this.state.strategy === 'masaniello') this.ui.operationLabel.innerText += ` de ${totalOps}`;
            this.ui.investmentAmount.innerText = `$${this.state.lastInvestment.toFixed(2)}`;
            if (this.state.strategy === 'gemhuel') {
                const g = this.state.gemhuel;
                this.ui.phaseDisplay.innerText = `FASE: ${g.phase}`;
                this.ui.phaseDisplay.style.color = g.phase === 'Ataque' ? 'var(--color-secondary)' : 'var(--color-warning)';
            } else {
                const m = this.state.masaniello;
                this.ui.phaseDisplay.innerText = `GANADAS: ${m.winsSoFar} de ${m.expectedWins}`;
                this.ui.phaseDisplay.style.color = 'var(--color-primary)';
            }
        },

        updateScoreboard() {
            const initial = this.state.initialBalance;
            const current = this.state.currentBalance;
            const profit = current - initial;
            this.ui.sbInitial.textContent = `$${initial.toFixed(2)}`;
            this.ui.sbCurrent.textContent = `$${current.toFixed(2)}`;
            this.ui.sbProfit.textContent = `$${profit.toFixed(2)}`;
            this.ui.sbProfit.classList.remove('positive', 'negative');
            if (profit > 0) this.ui.sbProfit.classList.add('positive');
            else if (profit < 0) this.ui.sbProfit.classList.add('negative');
            this.ui.sbCurrent.classList.remove('positive', 'negative');
            if (current > initial) this.ui.sbCurrent.classList.add('positive');
            else if (current < initial) this.ui.sbCurrent.classList.add('negative');
        },

        toggleActionButtons(enabled) {
            this.ui.winBtn.disabled = !enabled;
            this.ui.lossBtn.disabled = !enabled;
        },

        updateUI() {
            const strategy = this.ui.strategySelect.value;
            const info = {
                'gemhuel': { borderColor: 'var(--color-secondary)', title: '<strong>Riesgo:</strong> Inteligente', description: '<strong>Ideal para:</strong> Crecer reinvirtiendo ganancias. El riesgo solo aumenta después de ganar.', warning: '<strong>Advertencia:</strong> Mantén la disciplina y respeta tu plan de ciclo.' },
                'masaniello': { borderColor: 'var(--color-primary)', title: '<strong>Riesgo:</strong> Calculado', description: '<strong>Ideal para:</strong> Alcanzar un objetivo con una tasa de aciertos predefinida.', warning: '<strong>Advertencia:</strong> Si fallas más de lo permitido, puedes perder el capital del ciclo.' }
            };
            this.ui.strategyInfoBox.style.borderColor = info[strategy].borderColor;
            this.ui.strategyInfoBox.innerHTML = `<p>${info[strategy].title}</p><p>${info[strategy].description}</p><p style="opacity: 0.8;">${info[strategy].warning}</p>`;
            this.ui.masanielloGroup.classList.toggle('hidden', strategy !== 'masaniello');
            this.ui.gemhuelGroup.classList.toggle('hidden', strategy !== 'gemhuel');
        }
    };
    App.init();
});
