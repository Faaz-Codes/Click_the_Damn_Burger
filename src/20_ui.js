// Plan 3/4 skeleton: a minimal but real playable UI.
// Every DOM touch lives behind an environment guard so
// this file can be concatenated into the same bundle the
// Node tests import without breaking them.
//
// Performance contract: the whole DOM is built ONCE.
// The tick loop and every click only update text / width
// on cached elements; the shop list is rebuilt only when
// the active tab changes or a purchase succeeds. Nothing
// tears down and recreates the burger, tabs, or pills,
// which is what previously ate clicks mid-press and
// caused the input lag.
if (typeof document !== 'undefined' && document.getElementById('app')) {
  (function () {
    'use strict';
    var state = newState(Date.now());
    var app = document.getElementById('app');
    var activeTab = 'food';
    var lastNotice = '';

    function el(tag, cls, html) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (html != null) n.innerHTML = html;
      return n;
    }

    function fmtCost(cost) {
      if (!cost) return '--';
      return fmt.num(cost.amount) + ' ' + cost.currency;
    }

    // ---- Build the static shell exactly once ------------------------------
    app.innerHTML = '';
    app.appendChild(el('h1', null, 'SNACKONOMICS'));

    var top = el('div', 'topbar');
    var greaseEl = el('b', null, '0');
    var gPill = el('div', 'pill'); gPill.appendChild(greaseEl); gPill.appendChild(el('small', null, 'Grease'));
    var rateEl = el('b', null, '0/s');
    var ratePill = el('div', 'pill'); ratePill.appendChild(rateEl); ratePill.appendChild(el('small', null, 'Production'));
    var clickEl = el('b', null, '0');
    var clickPill = el('div', 'pill'); clickPill.appendChild(clickEl); clickPill.appendChild(el('small', null, 'Per click'));
    var lvEl = el('b', null, '1');
    var lvPill = el('div', 'pill'); lvPill.appendChild(lvEl); lvPill.appendChild(el('small', null, 'Level'));
    top.appendChild(gPill); top.appendChild(ratePill); top.appendChild(clickPill); top.appendChild(lvPill);
    app.appendChild(top);

    var stage = el('div', 'stage');
    var burger = el('div', 'burger', '🍔');
    stage.appendChild(burger);
    var foodNameEl = el('div', 'foodname', '');
    stage.appendChild(foodNameEl);
    var barwrap = el('div', 'barwrap');
    var barEl = el('div', 'bar');
    barwrap.appendChild(barEl);
    stage.appendChild(barwrap);
    var lifetimeEl = el('div', 'note', '');
    stage.appendChild(lifetimeEl);
    app.appendChild(stage);

    var noticeEl = el('div', 'notice', '');
    app.appendChild(noticeEl);

    var tabEls = [];
    var tabs = el('div', 'tabs');
    ['food', 'automation', 'employees'].forEach(function (t) {
      var label = t === 'food' ? 'Food Upgrades' : (t === 'automation' ? 'Automation' : 'Employees');
      var b = el('div', 'tab', label);
      b.addEventListener('click', function () {
        if (activeTab === t) return;
        activeTab = t;
        updateTabClasses();
        renderList();
      });
      tabs.appendChild(b);
      tabEls.push({ t: t, b: b });
    });
    app.appendChild(tabs);

    var listEl = el('div', 'list');
    app.appendChild(listEl);

    function updateTabClasses() {
      tabEls.forEach(function (row) {
        row.b.className = 'tab' + (activeTab === row.t ? ' active' : '');
      });
    }

    function updateCounters() {
      greaseEl.textContent = fmt.num(state.run.currencies.grease);
      rateEl.textContent = fmt.num(Sel.greasePerSec(state)) + '/s';
      clickEl.textContent = fmt.num(Sel.clickPower(state));
      lvEl.textContent = String(state.run.foodLevel);
      var cur = currentFood(state);
      foodNameEl.textContent = 'Lv ' + state.run.foodLevel + ' · ' + (cur ? cur.name : '?');
      var life = lifeVal(state);
      barEl.style.width = (Math.min(1, life / (cur ? cur.threshold : 1)) * 100).toFixed(1) + '%';
      lifetimeEl.textContent = fmt.num(BigNum.fromNumber(life)) + ' lifetime grease / ' + fmt.num(BigNum.fromNumber(cur ? cur.threshold : 0));
      noticeEl.textContent = lastNotice;
    }

    function renderList() {
      listEl.innerHTML = '';
      var items = [];
      if (activeTab === 'food') {
        items = DATA.upgrades
          .filter(function (u) { return u.tree === 'food'; })
          .map(function (u) { return { def: u, owned: state.run.upgrades[u.id] ? 1 : 0, kind: 'upgrade' }; });
      } else if (activeTab === 'automation') {
        items = DATA.automation.map(function (a) {
          return { def: a, owned: state.run.automation[a.id] || 0, kind: 'automation' };
        });
      } else {
        items = DATA.employees.map(function (e) {
          return { def: e, owned: state.run.employees[e.id] || 0, kind: 'employee' };
        });
      }

      items.forEach(function (it) {
        var row = el('div', 'row');
        var left = el('div');
        left.appendChild(el('h3', null, it.def.name + (it.owned > 0 ? ' <span class="owned">×' + it.owned + '</span>' : '')));
        left.appendChild(el('div', 'meta', it.def.desc || ''));
        row.appendChild(left);

        var cost;
        if (it.kind === 'upgrade') cost = Sel.costOf(state, 'upgrade', it.def.id, 0);
        else if (it.kind === 'automation') cost = Sel.costOf(state, 'automation', it.def.id, state.run.automation[it.def.id] || 0);
        else cost = Sel.costOf(state, 'employee', it.def.id, state.run.employees[it.def.id] || 0);

        var btn = el('button', 'buy', fmtCost(cost));
        var ownedUpgrade = it.kind === 'upgrade' && state.run.upgrades[it.def.id] === true;
        btn.disabled = ownedUpgrade || !Sel.canAfford(state, cost);
        btn.addEventListener('click', function () {
          var r;
          if (it.kind === 'upgrade') r = Actions.buyUpgrade(state, it.def.id);
          else if (it.kind === 'automation') r = Actions.buyAutomation(state, it.def.id, 1);
          else r = Actions.buyEmployee(state, it.def.id, 1);
          lastNotice = r.ok ? '' : (r.reason || 'cannot buy');
          updateCounters();
          renderList();
        });
        row.appendChild(btn);
        listEl.appendChild(row);
      });
    }

    burger.addEventListener('click', function () {
      click(state, Date.now());
      updateCounters();
    });

    setInterval(function () {
      tick(state, Date.now());
      updateCounters();
    }, 150);

    updateTabClasses();
    renderList();
    updateCounters();
  })();
}
