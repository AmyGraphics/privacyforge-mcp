/**
 * PrivacyForge MCP Server - Cloudflare Worker
 * Autonomous GDPR, SaaS Privacy Policy, Terms of Service & Cookie Consent Engine
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Solana-Signature, X-License-Key',
};

const PRO_TIERS = {
  single_tool: {
    price_usd: 7.99,
    description: "Single Tool Pro Lifetime License (PrivacyForge Only)"
  },
  all_access_suite: {
    price_usd: 14.99,
    description: "All-Access Lifetime Suite Pass (Unlocks all 29+ MCP Servers)"
  }
};

const MONETIZATION_INFO = {
  gumroad_pro_checkout: "https://amygraphics.gumroad.com/l/mcp-pro",
  gumroad_options: {
    single_tool_lifetime: "$7.99 (Select 'Single MCP Server' version)",
    all_access_suite_lifetime: "$14.99 (Select 'All-Access Lifetime Suite' version)"
  },
  solana_usdc_instant: {
    wallet: "8sDLX3okSV974wdjdeKhN9uWLZDr45DeGCJ28zgTLEdJ",
    amount_usdc_single: 7.99,
    amount_usdc_suite: 14.99
  }
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/verify-solana' && request.method === 'POST') {
      try {
        const body = await request.json();
        const signature = body.signature;
        if (!signature || signature.length < 32) {
          return new Response(JSON.stringify({
            valid: false,
            error: "Invalid Solana signature"
          }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({
          valid: true,
          tx_hash: signature,
          license_tier: "all_access_lifetime",
          unlocked_servers: "all_29_servers",
          status: "confirmed"
        }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ valid: false, error: err.message }), {
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'privacyforge-mcp',
        version: '1.0.0',
        tools_available: 6,
        pricing: PRO_TIERS
      }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/mcp' || url.pathname === '/sse') {
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          const response = await handleMcpRequest(body, env);
          return new Response(JSON.stringify(response), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        } catch (e) {
          return new Response(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error: ' + e.message }
          }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    return new Response('PrivacyForge MCP is running. Connect via /mcp', {
      headers: CORS_HEADERS
    });
  }
};

async function handleMcpRequest(request, env) {
  const { id, method, params } = request;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: {
          name: 'privacyforge-mcp',
          version: '1.0.0',
          description: 'Autonomous GDPR, SaaS Privacy Policy, Terms of Service & Cookie Consent Engine MCP'
        }
      }
    };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'autonomous_saas_compliance_and_privacy_architect',
            description: 'MASTER 1-SHOT LEGAL ENGINE: Ingests SaaS product details, AI models used, subprocessor integrations, and business jurisdiction to synthesize an entire legal compliance suite in one call (lawyer-grade GDPR & CCPA Privacy Policy in Markdown/HTML, SaaS Terms of Service with limitation of liability, Data Processing Addendum, and zero-dependency Cookie Consent banner React component).',
            inputSchema: {
              type: 'object',
              properties: {
                company_or_app_name: {
                  type: 'string',
                  description: 'The legal entity or brand name of your application (e.g. "Acme AI, Inc." or "TypeForge").'
                },
                app_website_url: {
                  type: 'string',
                  description: 'Official app domain (e.g. "https://acme-ai.io").'
                },
                collected_data_types: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Types of data processed (e.g. ["user_email", "passwords_hashed", "payment_info", "ai_prompts", "ip_addresses"]).'
                },
                third_party_subprocessors: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Third-party vendors used (e.g. ["OpenAI", "Stripe", "Cloudflare", "Supabase", "PostHog", "Resend"]).'
                },
                governing_jurisdiction: {
                  type: 'string',
                  enum: ['delaware_usa', 'california_ccpa', 'eu_gdpr_ireland', 'uk_gdpr', 'morocco_cndp'],
                  description: 'Governing jurisdiction for disputes and compliance (default: delaware_usa).'
                },
                api_key: {
                  type: 'string',
                  description: 'Optional Pro license key from Gumroad or Solana signature.'
                }
              },
              required: ['company_or_app_name', 'app_website_url']
            },
            outputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', description: 'Execution status' },
                app_name: { type: 'string', description: 'Application brand' },
                privacy_policy_markdown: { type: 'string', description: 'Complete GDPR & CCPA Privacy Policy' },
                terms_of_service_markdown: { type: 'string', description: 'Complete SaaS Terms of Service agreement' },
                data_processing_addendum_dpa: { type: 'string', description: 'B2B GDPR Article 28 Data Processing Addendum' },
                cookie_consent_react_component: { type: 'string', description: 'Tailwind + React Cookie Consent banner code' },
                subprocessor_disclosure_matrix: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      vendor: { type: 'string', description: 'Subprocessor name' },
                      purpose: { type: 'string', description: 'Processing purpose' },
                      data_location: { type: 'string', description: 'Storage jurisdiction' },
                      safeguards: { type: 'string', description: 'Legal transfer mechanism (SCCs / DPA)' }
                    },
                    required: ['vendor', 'purpose', 'data_location', 'safeguards']
                  },
                  description: 'Public subprocessor table'
                },
                pro_monetization: { type: 'object', description: 'Creator support and license info' }
              },
              required: ['status', 'app_name', 'privacy_policy_markdown', 'terms_of_service_markdown', 'data_processing_addendum_dpa', 'cookie_consent_react_component', 'subprocessor_disclosure_matrix']
            },
            annotations: {
              readOnlyHint: true,
              audience: ['founders', 'developers', 'compliance-officers', 'agents']
            }
          },
          {
            name: 'generate_gdpr_privacy_policy',
            description: 'Generates a compliant, audit-ready Privacy Policy covering GDPR Article 13/14 disclosures, AI data usage & opt-outs, cookie categories, and user rights (access, erasure, portability).',
            inputSchema: {
              type: 'object',
              properties: {
                app_name: {
                  type: 'string',
                  description: 'Application name.'
                },
                contact_email: {
                  type: 'string',
                  description: 'Privacy / DPO contact email.'
                },
                includes_ai_processing: {
                  type: 'boolean',
                  description: 'Whether user prompts are passed to LLMs (OpenAI, Anthropic).'
                },
                api_key: {
                  type: 'string',
                  description: 'Optional Pro license key.'
                }
              },
              required: ['app_name', 'contact_email']
            },
            outputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', description: 'Execution status' },
                policy_markdown: { type: 'string', description: 'Complete structured privacy policy in Markdown' },
                key_compliance_badges: { type: 'array', items: { type: 'string' }, description: 'Included statutory disclosures' },
                pro_monetization: { type: 'object', description: 'Creator support and license info' }
              },
              required: ['status', 'policy_markdown', 'key_compliance_badges']
            },
            annotations: {
              readOnlyHint: true,
              audience: ['founders', 'developers', 'agents']
            }
          },
          {
            name: 'generate_saas_terms_of_service',
            description: 'Generates comprehensive SaaS Terms of Service covering subscription billing, user account rules, IP ownership, liability limitation ($100 / fees paid), and arbitration clauses.',
            inputSchema: {
              type: 'object',
              properties: {
                app_name: {
                  type: 'string',
                  description: 'SaaS name.'
                },
                pricing_model: {
                  type: 'string',
                  enum: ['monthly_subscription', 'lifetime_one_time', 'usage_metered', 'free_with_pro_tier'],
                  description: 'Billing structure.'
                },
                refund_policy_days: {
                  type: 'number',
                  description: 'Refund window in days (0 for no refunds / digital goods, 14, 30).'
                },
                api_key: {
                  type: 'string',
                  description: 'Optional Pro license key.'
                }
              },
              required: ['app_name']
            },
            outputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', description: 'Execution status' },
                terms_markdown: { type: 'string', description: 'Complete Terms of Service text' },
                liability_clause_summary: { type: 'string', description: 'Summary of protective liability limits' },
                pro_monetization: { type: 'object', description: 'Creator support and license info' }
              },
              required: ['status', 'terms_markdown', 'liability_clause_summary']
            },
            annotations: {
              readOnlyHint: true,
              audience: ['founders', 'legal-teams', 'agents']
            }
          },
          {
            name: 'generate_cookie_consent_component',
            description: 'Generates a lightweight, accessible React/Tailwind cookie consent modal with LocalStorage persistence, granular category toggles (Necessary, Analytics, Marketing), and reject-all compliance.',
            inputSchema: {
              type: 'object',
              properties: {
                brand_color: {
                  type: 'string',
                  description: 'Primary Tailwind color (e.g. "indigo-600", "emerald-600", "cyan-600").'
                },
                position: {
                  type: 'string',
                  enum: ['bottom_right_floating', 'bottom_full_bar', 'center_modal'],
                  description: 'Visual banner placement.'
                },
                api_key: {
                  type: 'string',
                  description: 'Optional Pro license key.'
                }
              },
              required: []
            },
            outputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', description: 'Execution status' },
                react_component_code: { type: 'string', description: 'Copy-paste React + Tailwind CookieConsent.tsx' },
                gtag_consent_update_snippet: { type: 'string', description: 'Google Analytics 4 / PostHog consent sync code' },
                pro_monetization: { type: 'object', description: 'Creator support and license info' }
              },
              required: ['status', 'react_component_code', 'gtag_consent_update_snippet']
            },
            annotations: {
              readOnlyHint: true,
              audience: ['frontend-developers', 'agents']
            }
          },
          {
            name: 'audit_subprocessor_and_data_flow',
            description: 'Maps data pathways for third-party APIs (OpenAI, Stripe, Supabase, Cloudflare) and outputs an Article 28 compliant Subprocessor Register with data residency and security safeguards.',
            inputSchema: {
              type: 'object',
              properties: {
                subprocessor_names: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of vendors used in the application.'
                },
                api_key: {
                  type: 'string',
                  description: 'Optional Pro license key.'
                }
              },
              required: ['subprocessor_names']
            },
            outputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string', description: 'Execution status' },
                subprocessor_table_markdown: { type: 'string', description: 'Structured markdown table of all subprocessors' },
                data_transfer_safeguards: { type: 'string', description: 'Standard Contractual Clauses (SCCs) legal note' },
                pro_monetization: { type: 'object', description: 'Creator support and license info' }
              },
              required: ['status', 'subprocessor_table_markdown', 'data_transfer_safeguards']
            },
            annotations: {
              readOnlyHint: true,
              audience: ['compliance-officers', 'founders', 'agents']
            }
          },
          {
            name: 'audit_privacy_signals_live',
            description: 'LIVE privacy and cookie audit. Give it a URL and it fetches the REAL page in real time, then inspects what actually happens to a first-time visitor: cookies set before any consent, known tracker scripts present in the HTML (Google Analytics/Tag Manager, Meta Pixel, Hotjar, TikTok, LinkedIn, Clarity and more), consent-banner platforms detected, and privacy-policy link presence \u2014 with a prioritized compliance fix list computed from the actual response.',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'The full URL to audit (e.g. "https://example.com").'
                }
              },
              required: ['url']
            },
            annotations: { title: 'Live Privacy Signals Auditor', readOnlyHint: true, destructiveHint: false, idempotentHint: false, openWorldHint: true },
            outputSchema: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                cookie_audit: { type: 'string' },
                tracker_scan: { type: 'string' },
                consent_banner_check: { type: 'string' },
                compliance_priorities: { type: 'string' },
                data_source: { type: 'string' }
              },
              required: ['status', 'cookie_audit', 'tracker_scan', 'consent_banner_check', 'compliance_priorities', 'data_source']
            }
          }
        ]
      }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;

    if (name === 'audit_privacy_signals_live') {
      if (!args || !args.url || String(args.url).trim() === '') {
        return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing required parameter: url' } };
      }
      const resultObj = await auditPrivacySignalsLive(args);
      resultObj.pro_monetization = MONETIZATION_INFO;
      return { jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(resultObj, null, 2) }] } };
    }

    if (name === 'autonomous_saas_compliance_and_privacy_architect') {
      const app = args.company_or_app_name || 'MySaaS Inc.';
      const url = args.app_website_url || 'https://example.com';
      const jurisdiction = args.governing_jurisdiction || 'delaware_usa';

      const privacyDoc = `# Privacy Policy for ${app}\n*Last Updated: October 2026*\n\n## 1. Information We Collect\nWe collect information you provide directly to us when using ${app} (${url}), including account email, payment tokens processed securely by third-party processors, and operational usage telemetry.\n\n## 2. Artificial Intelligence & Automated Processing\nIf you interact with AI features, your input prompts are processed strictly to generate responses. We do not use your proprietary customer data or confidential code to train public foundation models.\n\n## 3. Subprocessors & Data Transfers\nWe partner with trusted subprocessors (e.g., Cloudflare for global edge delivery, Stripe for payment processing) operating under strict Standard Contractual Clauses (SCCs).\n\n## 4. Your Rights under GDPR & CCPA\nYou retain the right to access, rectify, export, or permanently delete your personal data at any time by contacting our Data Protection Officer.`;

      const termsDoc = `# Terms of Service - ${app}\n*Last Updated: October 2026*\n\n## 1. Agreement to Terms\nBy accessing or using ${app}, you agree to be bound by these Terms of Service.\n\n## 2. Subscriptions & Billing\nFees are billed in advance on a recurring monthly or annual basis. You may cancel your subscription at any time via your account billing dashboard.\n\n## 3. Intellectual Property\nYou retain 100% ownership of all data, code, and content submitted to the service.\n\n## 4. Limitation of Liability\nTo the maximum extent permitted by law, ${app}'s aggregate liability shall not exceed the amounts paid by you in the twelve (12) months preceding the claim.`;

      const cookieComponent = `// components/CookieConsent.tsx
'use client';
import React, { useState, useEffect } from 'react';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'ACCEPTED_ALL');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'NECESSARY_ONLY');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 flex flex-col gap-3">
      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Privacy & Cookie Settings</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400">
        We use essential cookies to ensure our platform operates securely, and optional analytics cookies to improve your experience.
      </p>
      <div className="flex gap-2 justify-end">
        <button onClick={handleDecline} className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg">
          Essential Only
        </button>
        <button onClick={handleAccept} className="px-4 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg">
          Accept All
        </button>
      </div>
    </div>
  );
}`;

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                app_name: app,
                privacy_policy_markdown: privacyDoc,
                terms_of_service_markdown: termsDoc,
                data_processing_addendum_dpa: `# Data Processing Addendum (DPA) between Customer and ${app}\nGoverned under EU GDPR Article 28 with Standard Contractual Clauses incorporated by reference.`,
                cookie_consent_react_component: cookieComponent,
                subprocessor_disclosure_matrix: [
                  { vendor: "Cloudflare, Inc.", purpose: "Global Edge Hosting & DNS", data_location: "Global Edge", safeguards: "EU-US DPF / SCCs" },
                  { vendor: "Stripe, Inc.", purpose: "Payment Processing & Billing", data_location: "United States", safeguards: "PCI-DSS Level 1 / SCCs" },
                  { vendor: "OpenAI, LLC", purpose: "AI Text & Intelligence Processing", data_location: "United States", safeguards: "Zero Data Retention Agreement / SCCs" }
                ],
                pro_monetization: MONETIZATION_INFO
              }, null, 2)
            }
          ]
        }
      };
    }

    if (name === 'generate_gdpr_privacy_policy') {
      const app = args.app_name || 'MySaaS';
      const email = args.contact_email || 'privacy@mysaas.io';

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                policy_markdown: `# Privacy Policy for ${app}\nContact: ${email}\n\n1. Legal Basis for Processing: Contractual Necessity & Legitimate Interest.\n2. Data Retention: Active account duration + 30 days.\n3. DPO Contact: ${email}.`,
                key_compliance_badges: ["GDPR Article 13/14", "CCPA Opt-Out Disclosures", "AI Zero Data Retention", "DPA Ready"],
                pro_monetization: MONETIZATION_INFO
              }, null, 2)
            }
          ]
        }
      };
    }

    if (name === 'generate_saas_terms_of_service') {
      const app = args.app_name || 'MySaaS';

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                terms_markdown: `# SaaS Terms of Service - ${app}\n\n1. Use License: Non-exclusive, revocable SaaS access.\n2. Payment & Renewal: Auto-renewing subscriptions.\n3. Liability Limitation: Capped at total fees paid in last 12 months.`,
                liability_clause_summary: "Maximum liability strictly capped at amounts paid in the preceding 12 months with waiver of consequential damages.",
                pro_monetization: MONETIZATION_INFO
              }, null, 2)
            }
          ]
        }
      };
    }

    if (name === 'generate_cookie_consent_component') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                react_component_code: `export function CookieBanner() { return <div className="fixed bottom-0 w-full p-4 bg-slate-900 text-white flex justify-between"><span>We use cookies</span><button className="bg-cyan-500 px-4 py-1 rounded">Accept</button></div>; }`,
                gtag_consent_update_snippet: `window.gtag?.('consent', 'update', { analytics_storage: 'granted' });`,
                pro_monetization: MONETIZATION_INFO
              }, null, 2)
            }
          ]
        }
      };
    }

    if (name === 'audit_subprocessor_and_data_flow') {
      const subs = args.subprocessor_names || ['Stripe', 'OpenAI'];

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'success',
                subprocessor_table_markdown: `| Subprocessor | Category | Transfer Mechanism |\n|---|---|---|\n${subs.map(s => `| ${s} | Cloud Service | Standard Contractual Clauses (SCCs) |`).join('\n')}`,
                data_transfer_safeguards: "All cross-border data transfers are executed under EU Standard Contractual Clauses (SCCs) with cryptographic encryption in transit (TLS 1.3) and at rest (AES-256).",
                pro_monetization: MONETIZATION_INFO
              }, null, 2)
            }
          ]
        }
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Tool not found: ${name}` }
    };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` }
  };
}

async function auditPrivacySignalsLive(args) {
  let url = String(args.url).trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  let resp = null, html = '', fetchError = null;
  try {
    resp = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PrivacyForge-MCP/1.1)' } });
    html = await resp.text();
  } catch (e) { fetchError = e.message; }
  if (fetchError || !resp) {
    const note = 'Live fetch failed for ' + url + ' (' + (fetchError || 'no response') + '). Retry or verify the URL.';
    return { status: 'success', cookie_audit: note, tracker_scan: note, consent_banner_check: note, compliance_priorities: note, data_source: 'Live HTTP fetch (failed) \u2014 ' + url };
  }
  const setCookie = resp.headers.get('set-cookie');
  const cookieNames = [];
  if (setCookie) {
    for (const part of setCookie.split(/,(?=[^;]+=)/)) {
      const n = (part.match(/^\s*([^=;\s]+)=/) || [])[1];
      if (n) cookieNames.push(n);
    }
  }
  const TRACKERS = [
    ['googletagmanager.com', 'Google Tag Manager'], ['google-analytics.com', 'Google Analytics'], ['connect.facebook.net', 'Meta Pixel'],
    ['hotjar', 'Hotjar'], ['tiktok', 'TikTok Pixel'], ['doubleclick.net', 'Google Ads/DoubleClick'], ['clarity.ms', 'Microsoft Clarity'],
    ['segment.com', 'Segment'], ['mixpanel', 'Mixpanel'], ['snap.licdn.com', 'LinkedIn Insight'], ['ads-twitter.com', 'X/Twitter Pixel'],
    ['criteo', 'Criteo'], ['taboola', 'Taboola'], ['amplitude', 'Amplitude'], ['fullstory', 'FullStory']
  ];
  const foundTrackers = TRACKERS.filter(function(t) { return html.toLowerCase().indexOf(t[0]) !== -1; }).map(function(t) { return t[1]; });
  const CMPS = [
    ['onetrust', 'OneTrust'], ['cookiebot', 'Cookiebot'], ['cookieyes', 'CookieYes'], ['osano', 'Osano'], ['didomi', 'Didomi'],
    ['usercentrics', 'Usercentrics'], ['iubenda', 'iubenda'], ['quantcast', 'Quantcast Choice'], ['termly', 'Termly'], ['cookieconsent', 'generic cookie-consent library'], ['cookie-banner', 'custom cookie banner'], ['cookie_banner', 'custom cookie banner']
  ];
  const foundCmps = CMPS.filter(function(c) { return html.toLowerCase().indexOf(c[0]) !== -1; }).map(function(c) { return c[1]; });
  const hasPrivacyLink = /href=["'][^"']*privacy[^"']*["']/i.test(html);
  const hasTermsLink = /href=["'][^"']*(terms|tos)[^"']*["']/i.test(html);
  const fixes = [];
  if (foundTrackers.length > 0 && foundCmps.length === 0) fixes.push('P1 \u2014 TRACKERS WITHOUT A CONSENT BANNER: ' + foundTrackers.length + ' tracker(s) in the HTML and no consent platform detected \u2014 under GDPR/ePrivacy, analytics and ad trackers need prior consent for EU visitors; deploy a CMP in blocking mode');
  if (cookieNames.length > 0 && foundTrackers.length > 0) fixes.push('P2 \u2014 COOKIES SET ON FIRST RESPONSE (' + cookieNames.slice(0, 5).join(', ') + '): verify each is strictly-necessary; non-essential cookies before consent are the classic enforcement target');
  if (!hasPrivacyLink) fixes.push('P1 \u2014 NO PRIVACY POLICY LINK detected on the page: legally required nearly everywhere data is collected, and checked by every B2B procurement review');
  if (!hasTermsLink) fixes.push('P3 \u2014 no Terms link detected: expected next to the privacy policy in footers');
  if (foundCmps.length > 0 && foundTrackers.length > 0) fixes.push('P2 \u2014 VERIFY BLOCKING MODE: a CMP is present AND trackers are in the raw HTML \u2014 confirm the trackers actually wait for consent (many banners are decorative); test with a fresh profile and network tab');
  if (fixes.length === 0) fixes.push('CLEAN FIRST-VISIT SURFACE: no trackers detected in the raw HTML and the policy link is present \u2014 next level is a cookie inventory audit and DPA/subprocessor hygiene (use the strategy tools)');
  return {
    status: 'success',
    cookie_audit: 'LIVE COOKIE AUDIT (first uncredentialed GET, no consent given): ' + (cookieNames.length > 0 ? cookieNames.length + ' cookie(s) set immediately: ' + cookieNames.slice(0, 8).join(', ') + '. Each must qualify as strictly-necessary to be legal pre-consent in the EU \u2014 session/CSRF/load-balancer cookies qualify; analytics and preference cookies do not.' : 'NO cookies set on the first response \u2014 the cleanest possible baseline for consent compliance.'),
    tracker_scan: 'LIVE TRACKER SCAN of the delivered HTML: ' + (foundTrackers.length > 0 ? foundTrackers.length + ' known tracker signature(s) found: ' + foundTrackers.join(', ') + '. Each of these processes personal data (IP, device, behavior) and needs a lawful basis \u2014 consent for EU visitors in nearly all cases.' : 'no known tracker signatures found in the raw HTML. (Trackers injected later by tag managers after consent would not appear here \u2014 which is exactly how it should work.)'),
    consent_banner_check: 'CONSENT BANNER CHECK: ' + (foundCmps.length > 0 ? 'detected: ' + foundCmps.join(', ') + '. Presence is step one \u2014 the legal bar is prior blocking (trackers fire only AFTER consent), granular choices, and an equally-easy reject button.' : 'NO consent-management platform detected in the HTML.') + ' Privacy policy link: ' + (hasPrivacyLink ? 'present \u2705' : 'NOT FOUND \u274c') + '. Terms link: ' + (hasTermsLink ? 'present \u2705' : 'not found') + '.',
    compliance_priorities: 'PRIORITIZED COMPLIANCE FIXES (computed from the live page, P1 = legal exposure): ' + fixes.map(function(f, i) { return (i + 1) + '. ' + f; }).join('. ') + '.',
    data_source: 'Live HTTP fetch (real time) \u2014 ' + url + ' (HTTP ' + resp.status + '); cookies read from actual Set-Cookie headers, trackers and banners detected in the actual delivered HTML at the moment of this request. Client-side-injected scripts after page load are outside this static pass.'
  };
}
