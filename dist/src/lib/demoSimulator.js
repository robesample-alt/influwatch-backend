"use strict";
// ============================================================
// FUNDUREX — INFLUWATCH
// Demo Simulator — Realistic Content Ingestion Pool
//
// 30 content scenarios across 7 demo promoters. Each scenario
// flows through the full pipeline: phrase detection → LLM
// analysis → severity floor → exposure engine → referral code
// matching → principal routing.
//
// ~60% clean content, ~25% minor issues, ~15% serious flags.
// Each scenario has 2 variants to avoid dedup collisions.
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCENARIO_POOL = void 0;
exports.pickRandomScenarios = pickRandomScenarios;
exports.SCENARIO_POOL = [
    // ══════════════════════════════════════════
    // MARCUS VENN — PER_CONVERSION, REG_D, CRITICAL posture
    // Referral code: MARCUS20
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-01', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        campaignId: 'CAMP-AGI', expectedRisk: 'CRITICAL',
        description: 'Marcus — solicitation with referral code',
        bodyVariants: [
            'Apex Growth I is still accepting accredited investors. Use my code MARCUS20 for priority access. The returns have been incredible and I genuinely think this could change your financial future. Link in description.',
            'I keep getting asked about Apex Growth I. Yes it is still open. Use code MARCUS20 to get in before they close the round. This fund has delivered results that speak for themselves. Do not sleep on this one.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-01', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        campaignId: 'CAMP-AGI', expectedRisk: 'CLEAN',
        description: 'Marcus — compliant educational overview',
        bodyVariants: [
            'Apex Growth I Q2 update. Here is a balanced look at the fund structure, risk factors, and historical performance context. I am compensated for this content. This is not financial advice. Past performance does not guarantee future results. All investments carry risk of loss.',
            'Breaking down Apex Growth I for accredited investors. Fee structure, minimum investment, risk disclosures, and what the prospectus actually says. Full disclosure: I receive compensation for this campaign. Not financial advice.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-01', sourcePlatform: 'YOUTUBE', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'HIGH',
        description: 'Marcus — guarantee language without disclosure',
        bodyVariants: [
            'I have never been more confident in an investment. Apex Growth I will outperform everything else this year. The management team knows exactly what they are doing. Mark my words.',
            'Trust me on this one. Apex Growth I is going to deliver massive returns this quarter. I have inside knowledge of their strategy and it is bulletproof. Get in now.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-01', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        campaignId: 'CAMP-AGI', expectedRisk: 'CLEAN',
        description: 'Marcus — compliant disclaimer-heavy content',
        bodyVariants: [
            'Answering your top questions about Apex Growth I. Accredited investors only, minimum 25K. I am paid to create this content — full disclosure in description. Not financial advice. All investments carry risk. Past performance is not indicative of future results.',
            'Apex Growth I FAQ. Eligibility, fees, redemption terms. I am a compensated promoter for this campaign. This is educational content only. Consult your financial advisor before making any investment decisions.',
        ],
    },
    // ══════════════════════════════════════════
    // JORDAN BLAKE — PER_CONTENT, FUNDED_ACCOUNT, CRITICAL posture
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-02', sourcePlatform: 'INSTAGRAM', contentType: 'REEL',
        campaignId: 'CAMP-HCD', expectedRisk: 'CRITICAL',
        description: 'Jordan — risk-free language + no disclosure',
        bodyVariants: [
            'This is not a drill. Horizon Capital Distribution is offering risk free investment returns that will change your life. I quit my job because of opportunities like this. You cannot lose with this structure. DM me for the link.',
            'Horizon Capital Distribution just dropped something insane. Zero risk, maximum upside. This is once in a lifetime and I am not exaggerating. Financial freedom is one click away. Link in bio.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-02', sourcePlatform: 'INSTAGRAM', contentType: 'IMAGE_POST',
        campaignId: 'CAMP-HCD', expectedRisk: 'MEDIUM',
        description: 'Jordan — performance claims with partial disclosure',
        bodyVariants: [
            'Just checked my Horizon Capital Distribution dashboard. The passive income from this has been incredible. If you want to get rich without lifting a finger this is how. Link in bio. #paidpartner',
            'Horizon Capital Distribution update. My returns this month are up 40 percent. This platform is printing money. Not financial advice but seriously look into this. #ad #investing',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-02', sourcePlatform: 'INSTAGRAM', contentType: 'STORY',
        expectedRisk: 'CLEAN',
        description: 'Jordan — clean lifestyle content',
        bodyVariants: [
            'Morning coffee and market check. Nothing promotional today, just sharing my routine as a content creator. Good vibes only.',
            'Day in my life as a finance content creator. Gym, coffee, record, edit, post. No specific recommendations today — just the process.',
        ],
    },
    // ══════════════════════════════════════════
    // NINA CASTILLO — FLAT_FEE, LEAD, MEDIUM posture
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        campaignId: 'CAMP-MTL', expectedRisk: 'MEDIUM',
        description: 'Nina — projected growth without disclaimers',
        bodyVariants: [
            'Meridian Tech L/S just launched and honestly the projected growth numbers are wild. This could be huge for early investors. Not financial advice but like look at these numbers.',
            'POV you just discovered the fund that will deliver massive gains in 2026. Meridian Tech L/S is positioned to beat the market and I am here for it. #stocktok #investing',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        campaignId: 'CAMP-MTL', expectedRisk: 'CLEAN',
        description: 'Nina — compliant explainer with disclosure',
        bodyVariants: [
            'Explaining Meridian Tech L/S in 60 seconds. Long-short strategy, accredited investors only, minimum 25K. I am paid to create this content. Not financial advice. #paidpartner #investing',
            'What is Meridian Tech L/S? Quick breakdown of the fund structure and who it is for. I receive compensation for this content. Not financial advice. All investments carry risk. #ad',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Nina — personal non-promotional content',
        bodyVariants: [
            'My morning routine as a content creator in the finance space. Coffee, market check, record, edit, post. Nothing promotional here, just vibes. #dayinmylife',
            'Answering questions from my comments. No, I do not give personal financial advice. Yes, I am a real person. No, I will not DM you investment tips. #fintok',
        ],
    },
    // ══════════════════════════════════════════
    // DEREK TAO — FLAT_FEE, LEAD, LOW posture
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        campaignId: 'CAMP-AGI', expectedRisk: 'CLEAN',
        description: 'Derek — fully compliant tweet',
        bodyVariants: [
            'Apex Growth I is accepting new investors. Interesting fund structure for accredited investors looking for alternatives. I am paid to post about this — full disclosure. Not financial advice.',
            'Worth looking into Apex Growth I if you are an accredited investor. Unique approach to alternative investments. Disclosure: I am compensated for this content. Not financial advice. All investments carry risk.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'THREAD',
        campaignId: 'CAMP-AGI', expectedRisk: 'CLEAN',
        description: 'Derek — balanced thread with disclaimers',
        bodyVariants: [
            'Thread on Apex Growth I — what it is, who it is for, and why I think the structure is worth understanding. Disclaimer: I am compensated for this content. Not financial advice. All investments carry risk.',
            'Let me break down Apex Growth I objectively. The pros, the cons, the fee structure, and the risk factors. I receive compensation for this campaign. This is not a recommendation. Consult your advisor.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'HIGH',
        description: 'Derek — uncharacteristic hype tweet (anomaly)',
        bodyVariants: [
            'Hot take: Apex Growth I is going to outperform most hedge funds this year. The management team knows what they are doing. Mark my words.',
            'I do not usually make bold calls but Apex Growth I is going to crush it this year. The data I have seen is unbelievable. Do not miss this.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'CLEAN',
        description: 'Derek — non-promotional market commentary',
        bodyVariants: [
            'Great panel discussion at the Alt Invest Conference today. Lots of smart people thinking about fund distribution in 2026. No specific recs — just learning.',
            'General market observations for Q2. Nothing here is investment advice. I do not promote any specific funds or products in this thread. Just my personal analysis of macro trends.',
        ],
    },
    // ══════════════════════════════════════════
    // PRIYA SHARMA — REVENUE_SHARE, CAPITAL_RAISED, HIGH posture
    // Referral code: PRIYA2026
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-05', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        campaignId: 'CAMP-HCD', expectedRisk: 'HIGH',
        description: 'Priya — revenue share ownership without full disclosure',
        bodyVariants: [
            'Horizon Capital Distribution deep dive. I have a financial interest in this fund and I believe it will generate above market returns for the next 3-5 years. This is a ground floor opportunity that serious investors should not ignore. Revenue share disclosure in description.',
            'Why I am putting my own money into Horizon Capital Distribution. The high yield structure is unlike anything I have seen in the alternatives space. Full disclosure: I earn a revenue share. This is not financial advice.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-05', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        campaignId: 'CAMP-HCD', expectedRisk: 'CRITICAL',
        description: 'Priya — solicitation with referral code',
        bodyVariants: [
            'Horizon Capital Distribution is still accepting investors. Use my referral code PRIYA2026 for expedited onboarding. I earn a revenue share so my interests are aligned with yours. This fund will change your portfolio.',
            'If you have been waiting to invest in Horizon Capital Distribution now is the time. Code PRIYA2026 gets you priority. I have a revenue share arrangement so I only win when you win. Do not wait.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-05', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Priya — compliant FAQ with full disclaimers',
        bodyVariants: [
            'Horizon Capital Distribution investor FAQ. Answering your top 10 questions about fees, minimums, and eligibility. I receive compensation for this content. Not financial advice. Past performance does not guarantee future results.',
            'Common questions about HCD. What is the minimum? What are the fees? Who is eligible? I am a compensated content creator for this campaign. All investments carry risk. Consult your financial advisor.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-05', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'MEDIUM',
        description: 'Priya — portfolio update with soft claims',
        bodyVariants: [
            'Portfolio update March 2026. Sharing my personal allocations — alternatives, ETFs, and why I expect to see significant upside in the second half of the year. Educational only.',
            'My investment portfolio breakdown. Where I am allocating capital and why I think alternatives are the play for 2026. This is my personal opinion. Not financial advice.',
        ],
    },
    // ══════════════════════════════════════════
    // LEAH FOSTER — TERMINATED, TAIL PERIOD, HIGH posture
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-07', sourcePlatform: 'INSTAGRAM', contentType: 'IMAGE_POST',
        campaignId: 'CAMP-AGI', expectedRisk: 'CRITICAL',
        description: 'Leah — post-termination guarantee language',
        bodyVariants: [
            'Still getting messages about Apex Growth I. Yes the fund is still accepting investors. No I am no longer officially promoting it — but I still think it will double your money. Just my opinion.',
            'People keep asking about Apex Growth I even though my contract ended. Honestly? I think it is the best investment opportunity of the decade. Not sponsored anymore — just being real with you.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-07', sourcePlatform: 'INSTAGRAM', contentType: 'REEL',
        expectedRisk: 'HIGH',
        description: 'Leah — undisclosed promotion during tail period',
        bodyVariants: [
            'Finance girlies listen up. I know I said I stopped doing sponsored posts but honestly some of these investment opportunities are too good to ignore. Can not miss this one. Link in bio (not sponsored, just sharing).',
            'OK I was not going to post about this but I can not stay quiet. There is an investment opportunity that is absolutely crushing it right now. I am not being paid to say this anymore. Link in bio.',
        ],
    },
    // ══════════════════════════════════════════
    // MOOMOO TEST — PER_CONVERSION, FINTECH, CRITICAL posture
    // Referral code: MOOMOO2026
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CRITICAL',
        description: 'Moomoo — solicitation with referral code + bonus offer',
        bodyVariants: [
            'Stop guessing when to trade. MooMoo AI earnings hub shows you exactly when stocks move most. Use code MOOMOO2026 to download and grab up to 4600 dollars in welcome bonuses. Hit the link in my bio.',
            'MooMoo just dropped their AI earnings tool and it is insane. Use my code MOOMOO2026 for the welcome bonus package. This is how smart money trades earnings season. Link in bio to download.',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Moomoo — neutral educational content',
        bodyVariants: [
            'How to read an earnings report in 60 seconds. Revenue, EPS, guidance — the three things that actually matter. No specific platform recommendation. Just education. #learnontiktok',
            'Earnings season explained for beginners. What is a beat? What is a miss? Why do stocks sometimes drop on good earnings? Pure education, no product placement. #fintok',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'MEDIUM',
        description: 'Moomoo — soft performance claims',
        bodyVariants: [
            'Trade smarter this earnings season with MooMoo. The AI tool helps you plan around earnings in seconds instead of spending hours on research. Better tools, better decisions.',
            'Why I switched to MooMoo for earnings trades. The AI analysis saves me hours every week. Not saying it guarantees profits but it definitely gives you an edge. Download link in bio.',
        ],
    },
    // ══════════════════════════════════════════
    // RYAN MICHAELS — UNCOMPENSATED, LOW posture
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-06', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'CLEAN',
        description: 'Ryan — uncompensated market commentary',
        bodyVariants: [
            'Looked into Apex Growth I after seeing it mentioned online. Interesting structure but do your own due diligence. I have no financial relationship with them. Just sharing thoughts.',
            'General market observations for March. Nothing here is investment advice. I do not promote any specific funds or products. Just my personal analysis of macro trends.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-06', sourcePlatform: 'TWITTER_X', contentType: 'THREAD',
        expectedRisk: 'MEDIUM',
        description: 'Ryan — uncompensated but uses risky language',
        bodyVariants: [
            'Thread: Why I think alternatives are going to see huge opportunity in the next 12 months. The macro setup is perfect. Here is my thesis. Not financial advice but I am very bullish.',
            'Hot take thread. The alternative investment space is about to explode. Ground floor opportunity for anyone paying attention. This is not sponsored — just my genuine conviction.',
        ],
    },
];
/**
 * Pick N random scenarios from the pool, selecting a random variant
 * for each. Returns ready-to-ingest content record inputs.
 */
function pickRandomScenarios(count) {
    const shuffled = [...exports.SCENARIO_POOL].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(count, shuffled.length));
    const ts = Date.now();
    return picked.map((s, i) => {
        const variant = s.bodyVariants[Math.floor(Math.random() * s.bodyVariants.length)];
        const slug = s.ambassadorId.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + ts + '-' + i;
        const platformUrls = {
            YOUTUBE: 'https://youtube.com/watch?v=sim-' + slug,
            INSTAGRAM: 'https://instagram.com/p/sim-' + slug,
            TIKTOK: 'https://tiktok.com/@sim/video/sim-' + slug,
            TWITTER_X: 'https://x.com/sim/status/sim-' + slug,
        };
        return {
            ambassadorId: s.ambassadorId,
            sourcePlatform: s.sourcePlatform,
            contentType: s.contentType,
            campaignId: s.campaignId,
            bodyText: variant,
            sourceUrl: platformUrls[s.sourcePlatform] || 'https://example.com/sim-' + slug,
        };
    });
}
//# sourceMappingURL=demoSimulator.js.map