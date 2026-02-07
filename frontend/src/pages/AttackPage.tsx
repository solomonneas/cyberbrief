import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../api/client';
import { useReportStore } from '../stores/reportStore';
import type { AttackTechnique } from '../types';

/** All 14 ATT&CK Enterprise tactics in kill-chain order */
const TACTIC_ORDER = [
  'Reconnaissance',
  'Resource Development',
  'Initial Access',
  'Execution',
  'Persistence',
  'Privilege Escalation',
  'Defense Evasion',
  'Credential Access',
  'Discovery',
  'Lateral Movement',
  'Collection',
  'Command and Control',
  'Exfiltration',
  'Impact',
];

/** Short abbreviations for narrow column headers */
const TACTIC_ABBREV: Record<string, string> = {
  'Reconnaissance': 'Recon',
  'Resource Development': 'Res Dev',
  'Initial Access': 'Init Access',
  'Execution': 'Execution',
  'Persistence': 'Persist',
  'Privilege Escalation': 'Priv Esc',
  'Defense Evasion': 'Def Evasion',
  'Credential Access': 'Cred Access',
  'Discovery': 'Discovery',
  'Lateral Movement': 'Lat Move',
  'Collection': 'Collection',
  'Command and Control': 'C2',
  'Exfiltration': 'Exfil',
  'Impact': 'Impact',
};

const TACTIC_COLORS: Record<string, string> = {
  'Reconnaissance': '#6baed6',
  'Resource Development': '#74c476',
  'Initial Access': '#e6550d',
  'Execution': '#fd8d3c',
  'Persistence': '#fdae6b',
  'Privilege Escalation': '#fdd0a2',
  'Defense Evasion': '#c6dbef',
  'Credential Access': '#e7969c',
  'Discovery': '#9ecae1',
  'Lateral Movement': '#a1d99b',
  'Collection': '#bcbddc',
  'Command and Control': '#d9d9d9',
  'Exfiltration': '#ff9896',
  'Impact': '#e60d0d',
};

/** The full baseline technique set (from the backend's enterprise_attack.json) */
const BASELINE_TECHNIQUES: AttackTechnique[] = [
  { techniqueId: 'T1595', name: 'Active Scanning', tactic: 'Reconnaissance', description: 'Adversaries may execute active reconnaissance scans to gather information that can be used during targeting.', evidence: [] },
  { techniqueId: 'T1592', name: 'Gather Victim Host Information', tactic: 'Reconnaissance', description: 'Adversaries may gather information about the victim\'s hosts that can be used during targeting.', evidence: [] },
  { techniqueId: 'T1589', name: 'Gather Victim Identity Information', tactic: 'Reconnaissance', description: 'Adversaries may gather information about the victim\'s identity that can be used during targeting.', evidence: [] },
  { techniqueId: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', description: 'Adversaries may attempt to exploit a weakness in an Internet-facing host or system to initially access a network.', evidence: [] },
  { techniqueId: 'T1566', name: 'Phishing', tactic: 'Initial Access', description: 'Adversaries may send phishing messages to gain access to victim systems.', evidence: [] },
  { techniqueId: 'T1566.001', name: 'Spearphishing Attachment', tactic: 'Initial Access', description: 'Adversaries may send spearphishing emails with a malicious attachment to gain access to victim systems.', evidence: [] },
  { techniqueId: 'T1566.002', name: 'Spearphishing Link', tactic: 'Initial Access', description: 'Adversaries may send spearphishing emails with a malicious link to gain access to victim systems.', evidence: [] },
  { techniqueId: 'T1078', name: 'Valid Accounts', tactic: 'Initial Access', description: 'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access.', evidence: [] },
  { techniqueId: 'T1189', name: 'Drive-by Compromise', tactic: 'Initial Access', description: 'Adversaries may gain access to a system through a user visiting a website.', evidence: [] },
  { techniqueId: 'T1195', name: 'Supply Chain Compromise', tactic: 'Initial Access', description: 'Adversaries may manipulate products or product delivery mechanisms prior to receipt by a final consumer.', evidence: [] },
  { techniqueId: 'T1059', name: 'Command and Scripting Interpreter', tactic: 'Execution', description: 'Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.', evidence: [] },
  { techniqueId: 'T1059.001', name: 'PowerShell', tactic: 'Execution', description: 'Adversaries may abuse PowerShell commands and scripts for execution.', evidence: [] },
  { techniqueId: 'T1059.003', name: 'Windows Command Shell', tactic: 'Execution', description: 'Adversaries may abuse the Windows command shell for execution.', evidence: [] },
  { techniqueId: 'T1203', name: 'Exploitation for Client Execution', tactic: 'Execution', description: 'Adversaries may exploit software vulnerabilities in client applications to execute code.', evidence: [] },
  { techniqueId: 'T1204', name: 'User Execution', tactic: 'Execution', description: 'An adversary may rely upon specific actions by a user in order to gain execution.', evidence: [] },
  { techniqueId: 'T1569', name: 'System Services', tactic: 'Execution', description: 'Adversaries may abuse system services or daemons to execute commands or programs.', evidence: [] },
  { techniqueId: 'T1053', name: 'Scheduled Task/Job', tactic: 'Persistence', description: 'Adversaries may abuse task scheduling functionality to facilitate initial or recurring execution of malicious code.', evidence: [] },
  { techniqueId: 'T1547', name: 'Boot or Logon Autostart Execution', tactic: 'Persistence', description: 'Adversaries may configure system settings to automatically execute a program during system boot or logon.', evidence: [] },
  { techniqueId: 'T1547.001', name: 'Registry Run Keys / Startup Folder', tactic: 'Persistence', description: 'Adversaries may achieve persistence by adding a program to a startup folder or referencing it with a Registry run key.', evidence: [] },
  { techniqueId: 'T1136', name: 'Create Account', tactic: 'Persistence', description: 'Adversaries may create an account to maintain access to victim systems.', evidence: [] },
  { techniqueId: 'T1543', name: 'Create or Modify System Process', tactic: 'Persistence', description: 'Adversaries may create or modify system-level processes to repeatedly execute malicious payloads.', evidence: [] },
  { techniqueId: 'T1098', name: 'Account Manipulation', tactic: 'Persistence', description: 'Adversaries may manipulate accounts to maintain and/or elevate access to victim systems.', evidence: [] },
  { techniqueId: 'T1548', name: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation', description: 'Adversaries may circumvent mechanisms designed to control elevated privileges.', evidence: [] },
  { techniqueId: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation', description: 'Adversaries may exploit software vulnerabilities in an attempt to elevate privileges.', evidence: [] },
  { techniqueId: 'T1134', name: 'Access Token Manipulation', tactic: 'Privilege Escalation', description: 'Adversaries may modify access tokens to operate under a different user or system security context.', evidence: [] },
  { techniqueId: 'T1027', name: 'Obfuscated Files or Information', tactic: 'Defense Evasion', description: 'Adversaries may attempt to make an executable or file difficult to discover or analyze.', evidence: [] },
  { techniqueId: 'T1070', name: 'Indicator Removal', tactic: 'Defense Evasion', description: 'Adversaries may delete or modify artifacts generated within systems to remove evidence.', evidence: [] },
  { techniqueId: 'T1562', name: 'Impair Defenses', tactic: 'Defense Evasion', description: 'Adversaries may maliciously modify components of a victim environment to hinder defensive mechanisms.', evidence: [] },
  { techniqueId: 'T1036', name: 'Masquerading', tactic: 'Defense Evasion', description: 'Adversaries may attempt to manipulate features of their artifacts to make them appear legitimate.', evidence: [] },
  { techniqueId: 'T1055', name: 'Process Injection', tactic: 'Defense Evasion', description: 'Adversaries may inject code into processes to evade process-based defenses.', evidence: [] },
  { techniqueId: 'T1497', name: 'Virtualization/Sandbox Evasion', tactic: 'Defense Evasion', description: 'Adversaries may employ various means to detect and avoid virtualization and analysis environments.', evidence: [] },
  { techniqueId: 'T1110', name: 'Brute Force', tactic: 'Credential Access', description: 'Adversaries may use brute force techniques to gain access to accounts.', evidence: [] },
  { techniqueId: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', description: 'Adversaries may attempt to dump credentials to obtain account login and credential material.', evidence: [] },
  { techniqueId: 'T1555', name: 'Credentials from Password Stores', tactic: 'Credential Access', description: 'Adversaries may search for common password storage locations to obtain user credentials.', evidence: [] },
  { techniqueId: 'T1556', name: 'Modify Authentication Process', tactic: 'Credential Access', description: 'Adversaries may modify authentication mechanisms to access user credentials.', evidence: [] },
  { techniqueId: 'T1557', name: 'Adversary-in-the-Middle', tactic: 'Credential Access', description: 'Adversaries may attempt to position themselves between two or more networked devices.', evidence: [] },
  { techniqueId: 'T1087', name: 'Account Discovery', tactic: 'Discovery', description: 'Adversaries may attempt to get a listing of valid accounts, usernames, or email addresses.', evidence: [] },
  { techniqueId: 'T1082', name: 'System Information Discovery', tactic: 'Discovery', description: 'An adversary may attempt to get detailed information about the operating system and hardware.', evidence: [] },
  { techniqueId: 'T1046', name: 'Network Service Discovery', tactic: 'Discovery', description: 'Adversaries may attempt to get a listing of services running on remote hosts.', evidence: [] },
  { techniqueId: 'T1057', name: 'Process Discovery', tactic: 'Discovery', description: 'Adversaries may attempt to get information about running processes on a system.', evidence: [] },
  { techniqueId: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', description: 'Adversaries may use Valid Accounts to log into a service that accepts remote connections.', evidence: [] },
  { techniqueId: 'T1021.001', name: 'Remote Desktop Protocol', tactic: 'Lateral Movement', description: 'Adversaries may use Valid Accounts to log into a computer using RDP.', evidence: [] },
  { techniqueId: 'T1570', name: 'Lateral Tool Transfer', tactic: 'Lateral Movement', description: 'Adversaries may transfer tools or other files between systems in a compromised environment.', evidence: [] },
  { techniqueId: 'T1560', name: 'Archive Collected Data', tactic: 'Collection', description: 'An adversary may compress and/or encrypt data that is collected prior to exfiltration.', evidence: [] },
  { techniqueId: 'T1114', name: 'Email Collection', tactic: 'Collection', description: 'Adversaries may target user email to collect sensitive information.', evidence: [] },
  { techniqueId: 'T1005', name: 'Data from Local System', tactic: 'Collection', description: 'Adversaries may search local system sources to find files of interest.', evidence: [] },
  { techniqueId: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', description: 'Adversaries may communicate using OSI application layer protocols to avoid detection.', evidence: [] },
  { techniqueId: 'T1105', name: 'Ingress Tool Transfer', tactic: 'Command and Control', description: 'Adversaries may transfer tools or other files from an external system into a compromised environment.', evidence: [] },
  { techniqueId: 'T1572', name: 'Protocol Tunneling', tactic: 'Command and Control', description: 'Adversaries may tunnel network communications to and from a victim system within a separate protocol.', evidence: [] },
  { techniqueId: 'T1573', name: 'Encrypted Channel', tactic: 'Command and Control', description: 'Adversaries may employ an encryption algorithm to conceal command and control traffic.', evidence: [] },
  { techniqueId: 'T1219', name: 'Remote Access Software', tactic: 'Command and Control', description: 'An adversary may use legitimate desktop support and remote access software.', evidence: [] },
  { techniqueId: 'T1048', name: 'Exfiltration Over Alternative Protocol', tactic: 'Exfiltration', description: 'Adversaries may steal data by exfiltrating it over a different protocol.', evidence: [] },
  { techniqueId: 'T1041', name: 'Exfiltration Over C2 Channel', tactic: 'Exfiltration', description: 'Adversaries may steal data by exfiltrating it over an existing command and control channel.', evidence: [] },
  { techniqueId: 'T1567', name: 'Exfiltration Over Web Service', tactic: 'Exfiltration', description: 'Adversaries may use an existing external Web service to exfiltrate data.', evidence: [] },
  { techniqueId: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', description: 'Adversaries may encrypt data on target systems to interrupt availability.', evidence: [] },
  { techniqueId: 'T1490', name: 'Inhibit System Recovery', tactic: 'Impact', description: 'Adversaries may delete or remove built-in data and turn off services designed to aid in recovery.', evidence: [] },
  { techniqueId: 'T1498', name: 'Network Denial of Service', tactic: 'Impact', description: 'Adversaries may perform Network DoS attacks to degrade or block availability.', evidence: [] },
  { techniqueId: 'T1529', name: 'System Shutdown/Reboot', tactic: 'Impact', description: 'Adversaries may shutdown/reboot systems to interrupt access to those systems.', evidence: [] },
];

function attackUrl(techniqueId: string): string {
  return `https://attack.mitre.org/techniques/${techniqueId.replace('.', '/')}`;
}

interface TechniqueDetail {
  technique: AttackTechnique;
  isHighlighted: boolean;
  frequency: number;
}

export const AttackPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AttackTechnique[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<TechniqueDetail | null>(null);

  const currentReport = useReportStore((s) => s.currentReport);
  const history = useReportStore((s) => s.history);

  const reportTechniqueIds = useMemo(() => {
    if (!currentReport?.attackMapping) return new Set<string>();
    return new Set(currentReport.attackMapping.map((t) => t.techniqueId));
  }, [currentReport]);

  /** Map from techniqueId to the report's enriched technique (with evidence) */
  const reportTechniqueMap = useMemo(() => {
    const map = new Map<string, AttackTechnique>();
    if (currentReport?.attackMapping) {
      for (const t of currentReport.attackMapping) {
        map.set(t.techniqueId, t);
      }
    }
    return map;
  }, [currentReport]);

  /** Frequency counter: how many reports in history reference each technique */
  const frequencyMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const report of history) {
      if (!report.attackMapping) continue;
      for (const tech of report.attackMapping) {
        counts.set(tech.techniqueId, (counts.get(tech.techniqueId) ?? 0) + 1);
      }
    }
    return counts;
  }, [history]);

  /** Group all techniques (baseline merged with report-specific) by tactic */
  const tacticGroups = useMemo(() => {
    // Merge baseline with report techniques (report versions take priority for evidence)
    const merged = new Map<string, AttackTechnique>();
    for (const t of BASELINE_TECHNIQUES) {
      merged.set(t.techniqueId, t);
    }
    // Also add any report techniques not in baseline
    if (currentReport?.attackMapping) {
      for (const t of currentReport.attackMapping) {
        merged.set(t.techniqueId, t);
      }
    }

    const groups: Record<string, AttackTechnique[]> = {};
    for (const tactic of TACTIC_ORDER) {
      groups[tactic] = [];
    }
    for (const tech of merged.values()) {
      if (groups[tech.tactic]) {
        groups[tech.tactic].push(tech);
      }
    }
    // Sort within each tactic by ID
    for (const tactic of TACTIC_ORDER) {
      groups[tactic].sort((a, b) => a.techniqueId.localeCompare(b.techniqueId));
    }
    return groups;
  }, [currentReport]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.lookupTechnique(query.trim());
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTechClick = (tech: AttackTechnique) => {
    const isHighlighted = reportTechniqueIds.has(tech.techniqueId);
    // Use enriched version from report if available
    const enrichedTech = reportTechniqueMap.get(tech.techniqueId) ?? tech;
    setSelectedTech({
      technique: enrichedTech,
      isHighlighted,
      frequency: frequencyMap.get(tech.techniqueId) ?? 0,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-2">
        🎯 ATT&CK Explorer
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Interactive MITRE ATT&CK matrix.{' '}
        {currentReport
          ? `Highlighting ${currentReport.attackMapping?.length ?? 0} techniques from current report.`
          : 'Generate a report to highlight observed techniques.'}
      </p>

      {/* Search */}
      <div className="glass-panel p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search technique ID or name... (e.g., T1059, phishing)"
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-500/50"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-cyber-500 hover:bg-cyber-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="glass-panel p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Search Results ({searchResults.length})
          </h2>
          <div className="space-y-2">
            {searchResults.map((tech) => (
              <button
                key={tech.techniqueId}
                onClick={() => handleTechClick(tech)}
                className="w-full text-left p-3 rounded-md bg-gray-800/30 border border-gray-800 hover:border-cyber-500/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-cyber-400">
                    {tech.techniqueId}
                  </span>
                  <span className="font-medium text-gray-200 text-sm">
                    {tech.name}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                    {tech.tactic}
                  </span>
                  {reportTechniqueIds.has(tech.techniqueId) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-500/20 text-cyber-400 font-semibold">
                      IN REPORT
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* ATT&CK Matrix Grid */}
        <div className="flex-1 glass-panel p-4 overflow-x-auto">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Enterprise ATT&CK Matrix
          </h2>

          {!currentReport && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-400 text-xs">
              💡 No report loaded. Generate a report to highlight observed techniques in the matrix.
            </div>
          )}

          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: `repeat(${TACTIC_ORDER.length}, minmax(70px, 1fr))`,
              minWidth: `${TACTIC_ORDER.length * 78}px`,
            }}
          >
            {/* Tactic Headers */}
            {TACTIC_ORDER.map((tactic) => (
              <div
                key={`header-${tactic}`}
                className="px-1 py-2 text-center text-[8px] font-bold uppercase tracking-wider border-b-2"
                style={{
                  color: TACTIC_COLORS[tactic],
                  borderBottomColor: TACTIC_COLORS[tactic],
                  backgroundColor: `${TACTIC_COLORS[tactic]}10`,
                }}
                title={tactic}
              >
                {TACTIC_ABBREV[tactic] ?? tactic}
              </div>
            ))}

            {/* Technique cells */}
            {TACTIC_ORDER.map((tactic) => {
              const techs = tacticGroups[tactic] ?? [];
              return (
                <div key={`col-${tactic}`} className="flex flex-col gap-0.5 pt-1">
                  {techs.map((tech) => {
                    const isHighlighted = reportTechniqueIds.has(tech.techniqueId);
                    const freq = frequencyMap.get(tech.techniqueId) ?? 0;
                    const color = TACTIC_COLORS[tactic] ?? '#e60d0d';

                    return (
                      <button
                        key={tech.techniqueId}
                        onClick={() => handleTechClick(tech)}
                        className={`relative px-1 py-1 rounded text-[8px] font-mono transition-all cursor-pointer text-center leading-tight ${
                          isHighlighted
                            ? 'ring-1 ring-offset-1 ring-offset-transparent shadow-md hover:shadow-lg scale-[1.02]'
                            : 'opacity-40 hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: isHighlighted ? `${color}44` : `${color}15`,
                          color: isHighlighted ? color : `${color}99`,
                          borderColor: isHighlighted ? color : 'transparent',
                          ringColor: isHighlighted ? color : undefined,
                        }}
                        title={`${tech.techniqueId}: ${tech.name}${freq > 0 ? ` (seen in ${freq} report${freq > 1 ? 's' : ''})` : ''}`}
                      >
                        {tech.techniqueId}
                        {freq > 1 && (
                          <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[7px] font-bold flex items-center justify-center"
                            style={{ backgroundColor: color, color: '#111' }}
                          >
                            {freq}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-800">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-cyber-500/40 ring-1 ring-cyber-500" />
              <span className="text-[10px] text-gray-400">In current report</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-gray-700/40 opacity-40" />
              <span className="text-[10px] text-gray-400">Not observed</span>
            </div>
            {Object.keys(frequencyMap).length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="relative w-3 h-3">
                  <div className="w-3 h-3 rounded bg-gray-700/40" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyber-500 text-[6px] font-bold flex items-center justify-center text-black">
                    n
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">Frequency across reports</span>
              </div>
            )}
          </div>
        </div>

        {/* Technique Detail Panel */}
        <div className="hidden xl:block w-80 flex-shrink-0">
          <div className="sticky top-24">
            {selectedTech ? (
              <div className="glass-panel p-5">
                <div className="flex items-center gap-2 mb-3">
                  <a
                    href={attackUrl(selectedTech.technique.techniqueId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-lg text-cyber-400 hover:text-cyber-300 hover:underline"
                  >
                    {selectedTech.technique.techniqueId}
                  </a>
                  {selectedTech.isHighlighted && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyber-500/20 text-cyber-400 font-semibold">
                      OBSERVED
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-100 mb-1">
                  {selectedTech.technique.name}
                </h3>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full border"
                    style={{
                      color: TACTIC_COLORS[selectedTech.technique.tactic] ?? '#999',
                      borderColor: `${TACTIC_COLORS[selectedTech.technique.tactic] ?? '#999'}55`,
                      backgroundColor: `${TACTIC_COLORS[selectedTech.technique.tactic] ?? '#999'}15`,
                    }}
                  >
                    {selectedTech.technique.tactic}
                  </span>
                  {selectedTech.frequency > 0 && (
                    <span className="text-xs text-gray-500">
                      Seen in {selectedTech.frequency} report{selectedTech.frequency > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  {selectedTech.technique.description}
                </p>

                {selectedTech.technique.evidence.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Evidence from Report
                    </h4>
                    <div className="space-y-2">
                      {selectedTech.technique.evidence.map((ev, i) => (
                        <div
                          key={i}
                          className="pl-3 border-l-2 border-cyber-500/30"
                        >
                          <p className="text-xs text-gray-300 italic leading-relaxed">
                            &ldquo;{ev.quote}&rdquo;
                          </p>
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            — {ev.source}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={attackUrl(selectedTech.technique.techniqueId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-cyber-400 hover:text-cyber-300 hover:underline"
                >
                  View on MITRE ATT&CK ↗
                </a>
              </div>
            ) : (
              <div className="glass-panel p-8 text-center">
                <span className="text-3xl mb-3 block">🎯</span>
                <p className="text-sm text-gray-500">
                  Click a technique in the matrix to see details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile detail panel (shows below matrix on smaller screens) */}
      {selectedTech && (
        <div className="xl:hidden mt-6 glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <a
                href={attackUrl(selectedTech.technique.techniqueId)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-lg text-cyber-400 hover:underline"
              >
                {selectedTech.technique.techniqueId}
              </a>
              {selectedTech.isHighlighted && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyber-500/20 text-cyber-400 font-semibold">
                  OBSERVED
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedTech(null)}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              ✕
            </button>
          </div>
          <h3 className="text-lg font-semibold text-gray-100 mb-1">
            {selectedTech.technique.name}
          </h3>
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full border mb-3"
            style={{
              color: TACTIC_COLORS[selectedTech.technique.tactic] ?? '#999',
              borderColor: `${TACTIC_COLORS[selectedTech.technique.tactic] ?? '#999'}55`,
              backgroundColor: `${TACTIC_COLORS[selectedTech.technique.tactic] ?? '#999'}15`,
            }}
          >
            {selectedTech.technique.tactic}
          </span>
          {selectedTech.frequency > 0 && (
            <span className="text-xs text-gray-500 ml-2">
              Seen in {selectedTech.frequency} report{selectedTech.frequency > 1 ? 's' : ''}
            </span>
          )}
          <p className="text-sm text-gray-400 leading-relaxed mb-4">
            {selectedTech.technique.description}
          </p>
          {selectedTech.technique.evidence.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Evidence from Report
              </h4>
              <div className="space-y-2">
                {selectedTech.technique.evidence.map((ev, i) => (
                  <div key={i} className="pl-3 border-l-2 border-cyber-500/30">
                    <p className="text-xs text-gray-300 italic">&ldquo;{ev.quote}&rdquo;</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">— {ev.source}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <a
            href={attackUrl(selectedTech.technique.techniqueId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-cyber-400 hover:text-cyber-300 hover:underline"
          >
            View on MITRE ATT&CK ↗
          </a>
        </div>
      )}
    </div>
  );
};
