import { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/format';
import { Calendar, TrendingUp, BarChart3, Search, Lightbulb, DollarSign } from 'lucide-react';

const ProfitRow = ({ label, value, variant = 'default' }) => {
  const colors = { positive: 'var(--success)', negative: 'var(--danger)', default: 'var(--text-primary)' };
  return (
    <div className="profit-row">
      <span className="profit-label">{label}</span>
      <span className="profit-value" style={{ color: colors[variant] }}>{value}</span>
    </div>
  );
};

const PeriodCard = ({ title, data, icon }) => {
  if (!data) return null;
  const profitVariant = data.profit > 0 ? 'positive' : data.profit < 0 ? 'negative' : 'default';
  return (
    <div className="profit-period-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontWeight: 700, fontSize: 16 }}>
        <span>{icon}</span>
        <span>{title}</span>
        {data.count !== undefined && (
          <span className="badge badge-gray" style={{ marginLeft: 'auto' }}>{data.count} ventes</span>
        )}
      </div>
      <ProfitRow label="Chiffre d'affaires" value={formatCurrency(data.revenue)} />
      <ProfitRow label="Coût total" value={formatCurrency(data.cost)} />
      <ProfitRow label="Bénéfice net" value={formatCurrency(data.profit)} variant={profitVariant} />
      {data.revenue > 0 && (
        <ProfitRow
          label="Marge bénéficiaire"
          value={`${((data.profit / data.revenue) * 100).toFixed(1)}%`}
          variant={profitVariant}
        />
      )}
    </div>
  );
};

/** Convert "2026-10-06" → "06/10/2026" */
const formatDay = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const Profits = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });
  const [customLoading, setCustomLoading] = useState(false);

  useEffect(() => { loadReport(); }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await reportService.getProfit();
      setData(res.data.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const loadCustom = async () => {
    if (!customRange.startDate || !customRange.endDate) return;
    setCustomLoading(true);
    try {
      const res = await reportService.getProfit(customRange);
      setData((prev) => ({ ...prev, custom: res.data.data.custom }));
    } catch {} finally {
      setCustomLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Chargement des bénéfices..." />;

  const daily = data?.dailyBreakdown || [];
  const totalDailyProfit = daily.reduce((sum, d) => sum + (d.profit || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-header-title">Analyse des Bénéfices</div>
          <div className="page-header-subtitle">Rentabilité calculée depuis les ventes réelles</div>
        </div>
      </div>

      {/* Period cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>
        <PeriodCard title="Aujourd'hui" data={data?.today} icon={<Calendar size={18} className="text-primary" />} />
        <PeriodCard title="Cette semaine" data={data?.week} icon={<BarChart3 size={18} className="text-primary" />} />
        <PeriodCard title="Ce mois" data={data?.month} icon={<TrendingUp size={18} className="text-primary" />} />
      </div>

      {/* Custom Range */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">
            <Search size={18} className="text-primary" />
            Période personnalisée
          </span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Date début</label>
              <input className="form-control" type="date" value={customRange.startDate}
                onChange={(e) => setCustomRange((p) => ({ ...p, startDate: e.target.value }))} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Date fin</label>
              <input className="form-control" type="date" value={customRange.endDate}
                onChange={(e) => setCustomRange((p) => ({ ...p, endDate: e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={loadCustom}
              disabled={customLoading || !customRange.startDate || !customRange.endDate}>
              <Search size={15} />
              <span>{customLoading ? 'Calcul...' : 'Analyser'}</span>
            </button>
          </div>

          {data?.custom ? (
            <div style={{ maxWidth: 400 }}>
              <PeriodCard
                title={`${customRange.startDate} → ${customRange.endDate}`}
                data={data.custom}
                icon={<BarChart3 size={18} className="text-primary" />}
              />
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px' }}>
              Sélectionnez une période et cliquez sur Analyser
            </div>
          )}
        </div>
      </div>

      {/* ── Daily Breakdown ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">
            <Calendar size={18} className="text-primary" />
            Bénéfice par Jour{' '}
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>
              (30 derniers jours)
            </span>
          </span>
          {daily.length > 0 && (
            <span style={{
              fontSize: 14,
              fontWeight: 700,
              color: totalDailyProfit >= 0 ? 'var(--success)' : 'var(--danger)',
              background: totalDailyProfit >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              borderRadius: 8,
              padding: '4px 14px',
            }}>
              Total 30j : {totalDailyProfit >= 0 ? '+' : ''}{formatCurrency(totalDailyProfit)}
            </span>
          )}
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {daily.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              Aucune vente enregistrée ces 30 derniers jours
            </div>
          ) : (
            <div style={{ maxHeight: 460, overflowY: 'auto' }}>
              {/* Sticky header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '150px 1fr 1fr 1fr 90px',
                padding: '10px 20px',
                background: 'var(--bg-secondary)',
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid var(--border)',
                position: 'sticky',
                top: 0,
                zIndex: 1,
              }}>
                <span>📆 Date</span>
                <span>💰 CA</span>
                <span>🛒 Coût</span>
                <span>✅ Bénéfice</span>
                <span style={{ textAlign: 'right' }}>Ventes</span>
              </div>

              {daily.map((day, idx) => {
                const isPos = day.profit > 0;
                const isNeg = day.profit < 0;
                const profitColor = isPos ? 'var(--success)' : isNeg ? 'var(--danger)' : 'var(--text-muted)';
                const profitBg   = isPos ? 'rgba(34,197,94,0.11)' : isNeg ? 'rgba(239,68,68,0.11)' : 'transparent';
                const sign       = isPos ? '+' : '';
                return (
                  <div key={day._id} style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr 1fr 1fr 90px',
                    padding: '13px 20px',
                    alignItems: 'center',
                    borderBottom: idx < daily.length - 1 ? '1px solid var(--border)' : 'none',
                    background: idx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
                  }}>
                    {/* Date */}
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                      {formatDay(day._id)}
                    </span>
                    {/* Revenue */}
                    <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                      {formatCurrency(day.revenue)}
                    </span>
                    {/* Cost */}
                    <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                      {formatCurrency(day.cost)}
                    </span>
                    {/* Profit badge */}
                    <span style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: profitColor,
                      background: profitBg,
                      borderRadius: 6,
                      padding: '3px 10px',
                      display: 'inline-block',
                    }}>
                      {sign}{formatCurrency(day.profit)}
                    </span>
                    {/* Count */}
                    <span style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-muted)' }}>
                      {day.count} vente{day.count > 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Summary note */}
      <div className="alert alert-info">
        <Lightbulb size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Le bénéfice est calculé automatiquement depuis les ventes enregistrées:
          <strong> Bénéfice = Chiffre d'affaires − Coût d'achat</strong>.
          Il n'est jamais saisi manuellement.
        </span>
      </div>
    </div>
  );
};

export default Profits;
