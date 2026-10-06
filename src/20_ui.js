// Plan 3/4 skeleton: a minimal but real playable UI.
// Every DOM touch lives behind an environment guard so
// this file can be concatenated into the same bundle the
// Node tests import without breaking them.
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

    function foodProgress() {
      var lv = state.run.foodLevel;
      var cur = DATA.foodLevels[Math.max(0, lv - 1)];
      var life = lifeVal(state);
      return Math.min(1, life / cur.threshold);
    }

    function collectFoodUpgrades() {
      return DATA.upgrades.filter(function (u) { return u.tree === 'food'; });
    }

    function render() {
      app.innerHTML = '';
      var h1 = el('h1', null, 'SNACKONOMICS');
      app.appendChild(h1);

      var top = el('div', 'topbar');
      var gPill = el('div', 'pill', '<b>' + fmt.num(state.run.currencies.grease) + '</b><small>Grease</small>');
      var ratePill = el('div', 'pill', '<b>' + fmt.num(Sel.greasePerSec(state)) + '/s</b><small>Production</small>');
      var clickPill = el('div', 'pill', '<b>' + fmt.num(Sel.clickPower(state)) + '</b><small>Per click</small>');
      var lvPill = el('div', 'pill', '<b>' + state.run.foodLevel + '</b><small>Level</small>');
      top.appendChild(gPill); top.appendChild(ratePill); top.appendChild(clickPill); top.appendChild(lvPill);
      app.appendChild(top);

      var stage = el('div', 'stage');
      var burger = el('div', 'burger', '🍔');
      burger.addEventListener('click', function () { click(state, Date.now()); render(); });
      stage.appendChild(burger);
      var cur = currentFood(state);
      stage.appendChild(el('div', 'foodname', 'Lv ' + state.run.foodLevel + ' · ' + (cur ? cur.name : '?')));
      var barwrap = el('div', 'barwrap');
      var bar = el('div', 'bar');
      bar.style.width = (foodProgress() * 100).toFixed(1) + '%';
      barwrap.appendChild(bar);
      stage.appendChild(barwrap);
      stage.appendChild(el('div', 'note', fmt.num(BigNum.fromNumber(lifeVal(state))) + ' lifetime grease / ' + fmt.num(BigNum.fromNumber(cur ? cur.threshold : 0))));
      app.appendChild(stage);

      var notice = el('div', 'notice', lastNotice);
      app.appendChild(notice);

      var tabs = el('div', 'tabs');
      ['food', 'automation', 'employees'].forEach(function (t) {
        var b = el('div', 'tab' + (activeTab === t ? ' active' : ''), t === 'food' ? 'Food Upgrades' : (t === 'automation' ? 'Automation' : 'Employees'));
        b.addEventListener('click', function () { activeTab = t; render(); });
        tabs.appendChild(b);
      });
      app.appendChild(tabs);

      var list = el('div', 'list');
      var items = [];
      if (activeTab === 'food') items = collectFoodUpgrades().map(function (u) { return { def: u, owned: state.run.upgrades[u.id] ? 1 : 0 }; });
      else if (activeTab === 'automation') items = DATA.automation.map(function (a) { return { def: a, owned: state.run.automation[a.id] || 0 }; });
      else items = DATA.employees.map(function (e) { return { def: e, owned: state.run.employees[e.id] || 0 }; });

      items.forEach(function (it) {
        var rrow = el('div', 'row');
        var left = el('div');
        left.appendChild(el('h3', null, it.def.name + (it.owned > 0 ? ' <span class="owned">×' + it.owned + '</span>' : '')));
        left.appendChild(el('div', 'meta', it.def.desc || ''));
        rrow.appendChild(left);
        var cost;
        if (activeTab === 'food') cost = Sel.costOf(state, 'upgrade', it.def.id, 0);
        else if (activeTab === 'automation') cost = Sel.costOf(state, 'automation', it.def.id, state.run.automation[it.def.id] || 0);
        else cost = Sel.costOf(state, 'employee', it.def.id, state.run.employees[it.def.id] || 0);
        var btn = el('button', 'buy', fmtCost(cost));
        btn.disabled = (activeTab === 'food' && state.run.upgrades[it.def.id] === true) || !Sel.canAfford(state, cost);
        btn.addEventListener('click', function () {
          var r;
          if (activeTab === 'food') r = Actions.buyUpgrade(state, it.def.id);
          else if (activeTab === 'automation') r = Actions.buyAutomation(state, it.def.id, 1);
          else r = Actions.buyEmployee(state, it.def.id, 1);
          lastNotice = r.ok ? '' : (r.reason || 'cannot buy');
          render();
        });
        rrow.appendChild(btn);
        list.appendChild(rrow);
      });
      app.appendChild(list);
    }

    // The tick loop: advance production and re-render the
    // numbers. clicks only happen on user input.
    setInterval(function () { tick(state, Date.now()); render(); }, 150);
    render();
  })();
}
