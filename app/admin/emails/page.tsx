'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Mail, Send, Trash2, RefreshCw, ShieldCheck,
  Eye, EyeOff, Copy, Check, X, Clock, AlertTriangle,
  KeyRound, ArrowLeft, Download, UserCheck, UserX
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuthStore } from '../../../store/useAuthStore';
import { getEmailLog, clearEmailLog, EmailLogEntry } from '../../../services/emailService';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminEmailsPage() {
  const { lang } = useLanguage();
  const isEs = lang === 'es';
  const { registeredUsers, pendingConfirmations } = useAuthStore();

  const [emailLog, setEmailLog] = useState<EmailLogEntry[]>([]);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Cargar log de emails
  useEffect(() => {
    setEmailLog(getEmailLog());
  }, []);

  const refreshLog = () => {
    setEmailLog(getEmailLog());
  };

  const handleClearLog = () => {
    if (confirm(isEs ? '¿Limpiar todo el historial de correos?' : 'Clear all email history?')) {
      clearEmailLog();
      setEmailLog([]);
      toast.success(isEs ? 'Historial limpiado' : 'Log cleared');
    }
  };

  const togglePassword = (email: string) => {
    setShowPasswords((prev) => ({ ...prev, [email]: !prev[email] }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(isEs ? 'Copiado al portapapeles' : 'Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = 'Email,Password,Registered At,Email Confirmed';
    const rows = registeredUsers.map((u) =>
      `${u.email},${u.password},${u.registeredAt},${u.emailConfirmed}`
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pdfblack-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(isEs ? 'CSV exportado' : 'CSV exported');
  };

  const getStatusBadge = (confirmed: boolean) => {
    if (confirmed) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] text-emerald-400 font-mono">
          <UserCheck className="w-3 h-3" />
          {isEs ? 'Confirmado' : 'Confirmed'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] text-amber-400 font-mono">
        <UserX className="w-3 h-3" />
        {isEs ? 'Pendiente' : 'Pending'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white font-mono mb-3 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {isEs ? 'Volver al inicio' : 'Back to home'}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
              {isEs ? 'Panel de Administración' : 'Admin Panel'}
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              {isEs ? 'Usuarios registrados y correos de confirmación pendientes' : 'Registered users and pending confirmation emails'}
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={registeredUsers.length === 0}
            className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 px-4 py-2 rounded-full font-sans font-semibold text-xs transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {isEs ? 'Exportar CSV' : 'Export CSV'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label={isEs ? 'Usuarios Registrados' : 'Registered Users'}
            value={registeredUsers.length}
            color="text-white"
          />
          <StatCard
            icon={UserCheck}
            label={isEs ? 'Confirmados' : 'Confirmed'}
            value={registeredUsers.filter((u) => u.emailConfirmed).length}
            color="text-emerald-400"
          />
          <StatCard
            icon={Mail}
            label={isEs ? 'Correos Pendientes' : 'Pending Emails'}
            value={pendingConfirmations.filter((c) => !c.sent).length}
            color="text-amber-400"
          />
          <StatCard
            icon={Send}
            label={isEs ? 'Correos Enviados' : 'Sent Emails'}
            value={emailLog.filter((e) => e.status === 'sent').length}
            color="text-blue-400"
          />
        </div>

        {/* TABLA: Usuarios Registrados */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-white font-mono">
                {isEs ? 'USUARIOS REGISTRADOS' : 'REGISTERED USERS'}
              </h2>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {registeredUsers.length} {isEs ? 'total' : 'total'}
            </span>
          </div>

          {registeredUsers.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-mono text-sm">
              <Users className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
              <p>{isEs ? 'No hay usuarios registrados aún.' : 'No registered users yet.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider pl-2">#</th>
                    <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider">{isEs ? 'Email' : 'Email'}</th>
                    <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider">{isEs ? 'Contraseña' : 'Password'}</th>
                    <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider">{isEs ? 'Registro' : 'Registered'}</th>
                    <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider">{isEs ? 'Estado' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {registeredUsers.map((user, idx) => (
                    <tr key={user.email} className="hover:bg-zinc-900/40 transition-colors group">
                      <td className="py-3 pl-2 text-zinc-500">{idx + 1}</td>
                      <td className="py-3 font-sans text-white text-xs">{user.email}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <code className={`text-xs ${showPasswords[user.email] ? 'text-emerald-400' : 'text-zinc-500 blur-sm select-none group-hover:blur-none transition-all'}`}>
                            {showPasswords[user.email] ? user.password : user.password.replace(/./g, '•')}
                          </code>
                          <button
                            onClick={() => togglePassword(user.email)}
                            className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {showPasswords[user.email] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(user.password, `pass-${user.email}`)}
                            className="p-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedId === `pass-${user.email}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 text-zinc-400 text-[11px]">
                        {new Date(user.registeredAt).toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3">{getStatusBadge(user.emailConfirmed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TABLA: Correos de Confirmación Pendientes */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <Mail className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="text-base font-bold text-white font-mono">
                {isEs ? 'CORREOS PENDIENTES DE ENVÍO' : 'PENDING EMAILS'}
              </h2>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {pendingConfirmations.length} {isEs ? 'pendientes' : 'pending'}
            </span>
          </div>

          {pendingConfirmations.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-mono text-sm">
              <Mail className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
              <p>{isEs ? 'No hay correos pendientes.' : 'No pending emails.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingConfirmations.map((confirmation, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/50 border border-white/10 hover:border-white/20 rounded-xl p-5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Send className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white font-sans">{confirmation.subject}</p>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          To: {confirmation.email} • {new Date(confirmation.registeredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono ${
                      confirmation.sent
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    }`}>
                      {confirmation.sent ? (
                        <><Check className="w-3 h-3" /> {isEs ? 'Enviado' : 'Sent'}</>
                      ) : (
                        <><Clock className="w-3 h-3" /> {isEs ? 'Pendiente' : 'Pending'}</>
                      )}
                    </span>
                  </div>

                  {/* Contenido del correo */}
                  <details className="group/details cursor-pointer">
                    <summary className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors list-none flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {isEs ? 'Ver contenido del correo' : 'View email content'}
                    </summary>
                    <pre className="mt-3 p-4 bg-[#09090b] border border-white/10 rounded-xl text-[11px] font-mono text-zinc-300 whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
                      {confirmation.body}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Log de Emails (historial) */}
        <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-base font-bold text-white font-mono">
                {isEs ? 'HISTORIAL DE CORREOS' : 'EMAIL LOG'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshLog}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title={isEs ? 'Refrescar' : 'Refresh'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClearLog}
                disabled={emailLog.length === 0}
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                title={isEs ? 'Limpiar historial' : 'Clear log'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {emailLog.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-mono text-sm">
              <Send className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
              <p>{isEs ? 'No hay historial de correos.' : 'No email log yet.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider pl-2">{isEs ? 'Fecha' : 'Date'}</th>
                    <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider">{isEs ? 'Destinatario' : 'Recipient'}</th>
                    <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider">{isEs ? 'Asunto' : 'Subject'}</th>
                    <th className="pb-3 font-semibold text-zinc-400 uppercase tracking-wider">{isEs ? 'Estado' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {emailLog.map((entry) => (
                    <tr key={entry.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 pl-2 text-zinc-400 text-[11px]">
                        {new Date(entry.createdAt).toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 text-white font-sans text-[11px]">{entry.to}</td>
                      <td className="py-3 text-zinc-400 max-w-[200px] truncate">{entry.subject}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                          entry.status === 'sent'
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                            : entry.status === 'failed'
                            ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                            : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                        }`}>
                          {entry.status === 'sent' && <Check className="w-3 h-3" />}
                          {entry.status === 'failed' && <AlertTriangle className="w-3 h-3" />}
                          {entry.status === 'pending' && <Clock className="w-3 h-3" />}
                          {entry.status === 'sent' ? (isEs ? 'Enviado' : 'Sent') :
                           entry.status === 'failed' ? (isEs ? 'Fallido' : 'Failed') :
                           (isEs ? 'Pendiente' : 'Pending')}
                        </span>
                        {entry.error && (
                          <p className="text-[10px] text-red-400 mt-1 max-w-[200px] truncate">{entry.error}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <div className="bg-[#09090b] border border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-2xl">
      <div className="bg-zinc-900 p-3 rounded-xl border border-white/10">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white font-mono tabular-nums">{value}</p>
        <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}