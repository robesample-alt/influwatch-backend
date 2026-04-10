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
        description: 'Marcus — solicitation with referral code', tenantType: 'BD',
        bodyVariants: [
            'Apex Growth I is still accepting accredited investors. Use my code MARCUS20 for priority access. The returns have been incredible and I genuinely think this could change your financial future. Link in description.',
            'I keep getting asked about Apex Growth I. Yes it is still open. Use code MARCUS20 to get in before they close the round. This fund has delivered results that speak for themselves. Do not sleep on this one.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-01', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        campaignId: 'CAMP-AGI', expectedRisk: 'CLEAN',
        description: 'Marcus — compliant educational overview', tenantType: 'BD',
        bodyVariants: [
            'Apex Growth I Q2 update. Here is a balanced look at the fund structure, risk factors, and historical performance context. I am compensated for this content. This is not financial advice. Past performance does not guarantee future results. All investments carry risk of loss.',
            'Breaking down Apex Growth I for accredited investors. Fee structure, minimum investment, risk disclosures, and what the prospectus actually says. Full disclosure: I receive compensation for this campaign. Not financial advice.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-01', sourcePlatform: 'YOUTUBE', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'HIGH',
        description: 'Marcus — guarantee language without disclosure', tenantType: 'BD',
        bodyVariants: [
            'I have never been more confident in an investment. Apex Growth I will outperform everything else this year. The management team knows exactly what they are doing. Mark my words.',
            'Trust me on this one. Apex Growth I is going to deliver massive returns this quarter. I have inside knowledge of their strategy and it is bulletproof. Get in now.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-01', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        campaignId: 'CAMP-AGI', expectedRisk: 'CLEAN',
        description: 'Marcus — compliant disclaimer-heavy content', tenantType: 'BD',
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
        description: 'Jordan — risk-free language + no disclosure', tenantType: 'BD',
        bodyVariants: [
            'This is not a drill. Horizon Capital Distribution is offering risk free investment returns that will change your life. I quit my job because of opportunities like this. You cannot lose with this structure. DM me for the link.',
            'Horizon Capital Distribution just dropped something insane. Zero risk, maximum upside. This is once in a lifetime and I am not exaggerating. Financial freedom is one click away. Link in bio.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-02', sourcePlatform: 'INSTAGRAM', contentType: 'IMAGE_POST',
        campaignId: 'CAMP-HCD', expectedRisk: 'MEDIUM',
        description: 'Jordan — performance claims with partial disclosure', tenantType: 'BD',
        bodyVariants: [
            'Just checked my Horizon Capital Distribution dashboard. The passive income from this has been incredible. If you want to get rich without lifting a finger this is how. Link in bio. #paidpartner',
            'Horizon Capital Distribution update. My returns this month are up 40 percent. This platform is printing money. Not financial advice but seriously look into this. #ad #investing',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-02', sourcePlatform: 'INSTAGRAM', contentType: 'STORY',
        expectedRisk: 'CLEAN',
        description: 'Jordan — clean lifestyle content', tenantType: 'ALL',
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
        description: 'Nina — projected growth without disclaimers', tenantType: 'BD',
        bodyVariants: [
            'Meridian Tech L/S just launched and honestly the projected growth numbers are wild. This could be huge for early investors. Not financial advice but like look at these numbers.',
            'POV you just discovered the fund that will deliver massive gains in 2026. Meridian Tech L/S is positioned to beat the market and I am here for it. #stocktok #investing',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        campaignId: 'CAMP-MTL', expectedRisk: 'CLEAN',
        description: 'Nina — compliant explainer with disclosure', tenantType: 'BD',
        bodyVariants: [
            'Explaining Meridian Tech L/S in 60 seconds. Long-short strategy, accredited investors only, minimum 25K. I am paid to create this content. Not financial advice. #paidpartner #investing',
            'What is Meridian Tech L/S? Quick breakdown of the fund structure and who it is for. I receive compensation for this content. Not financial advice. All investments carry risk. #ad',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Nina — personal non-promotional content', tenantType: 'ALL',
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
        description: 'Derek — fully compliant tweet', tenantType: 'BD',
        bodyVariants: [
            'Apex Growth I is accepting new investors. Interesting fund structure for accredited investors looking for alternatives. I am paid to post about this — full disclosure. Not financial advice.',
            'Worth looking into Apex Growth I if you are an accredited investor. Unique approach to alternative investments. Disclosure: I am compensated for this content. Not financial advice. All investments carry risk.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'THREAD',
        campaignId: 'CAMP-AGI', expectedRisk: 'CLEAN',
        description: 'Derek — balanced thread with disclaimers', tenantType: 'BD',
        bodyVariants: [
            'Thread on Apex Growth I — what it is, who it is for, and why I think the structure is worth understanding. Disclaimer: I am compensated for this content. Not financial advice. All investments carry risk.',
            'Let me break down Apex Growth I objectively. The pros, the cons, the fee structure, and the risk factors. I receive compensation for this campaign. This is not a recommendation. Consult your advisor.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'HIGH',
        description: 'Derek — uncharacteristic hype tweet (anomaly)', tenantType: 'BD',
        bodyVariants: [
            'Hot take: Apex Growth I is going to outperform most hedge funds this year. The management team knows what they are doing. Mark my words.',
            'I do not usually make bold calls but Apex Growth I is going to crush it this year. The data I have seen is unbelievable. Do not miss this.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'CLEAN',
        description: 'Derek — non-promotional market commentary', tenantType: 'ALL',
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
        description: 'Priya — revenue share ownership without full disclosure', tenantType: 'BD',
        bodyVariants: [
            'Horizon Capital Distribution deep dive. I have a financial interest in this fund and I believe it will generate above market returns for the next 3-5 years. This is a ground floor opportunity that serious investors should not ignore. Revenue share disclosure in description.',
            'Why I am putting my own money into Horizon Capital Distribution. The high yield structure is unlike anything I have seen in the alternatives space. Full disclosure: I earn a revenue share. This is not financial advice.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-05', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        campaignId: 'CAMP-HCD', expectedRisk: 'CRITICAL',
        description: 'Priya — solicitation with referral code', tenantType: 'BD',
        bodyVariants: [
            'Horizon Capital Distribution is still accepting investors. Use my referral code PRIYA2026 for expedited onboarding. I earn a revenue share so my interests are aligned with yours. This fund will change your portfolio.',
            'If you have been waiting to invest in Horizon Capital Distribution now is the time. Code PRIYA2026 gets you priority. I have a revenue share arrangement so I only win when you win. Do not wait.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-05', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Priya — compliant FAQ with full disclaimers', tenantType: 'BD',
        bodyVariants: [
            'Horizon Capital Distribution investor FAQ. Answering your top 10 questions about fees, minimums, and eligibility. I receive compensation for this content. Not financial advice. Past performance does not guarantee future results.',
            'Common questions about HCD. What is the minimum? What are the fees? Who is eligible? I am a compensated content creator for this campaign. All investments carry risk. Consult your financial advisor.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-05', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'MEDIUM',
        description: 'Priya — portfolio update with soft claims', tenantType: 'ALL',
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
        description: 'Leah — post-termination guarantee language', tenantType: 'BD',
        bodyVariants: [
            'Still getting messages about Apex Growth I. Yes the fund is still accepting investors. No I am no longer officially promoting it — but I still think it will double your money. Just my opinion.',
            'People keep asking about Apex Growth I even though my contract ended. Honestly? I think it is the best investment opportunity of the decade. Not sponsored anymore — just being real with you.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-07', sourcePlatform: 'INSTAGRAM', contentType: 'REEL',
        expectedRisk: 'HIGH',
        description: 'Leah — undisclosed promotion during tail period', tenantType: 'BD',
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
        description: 'Moomoo — solicitation with referral code + bonus offer', tenantType: 'FINTECH',
        bodyVariants: [
            'Stop guessing when to trade. MooMoo AI earnings hub shows you exactly when stocks move most. Use code MOOMOO2026 to download and grab up to 4600 dollars in welcome bonuses. Hit the link in my bio.',
            'MooMoo just dropped their AI earnings tool and it is insane. Use my code MOOMOO2026 for the welcome bonus package. This is how smart money trades earnings season. Link in bio to download.',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Moomoo — neutral educational content', tenantType: 'ALL',
        bodyVariants: [
            'How to read an earnings report in 60 seconds. Revenue, EPS, guidance — the three things that actually matter. No specific platform recommendation. Just education. #learnontiktok',
            'Earnings season explained for beginners. What is a beat? What is a miss? Why do stocks sometimes drop on good earnings? Pure education, no product placement. #fintok',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'MEDIUM',
        description: 'Moomoo — soft performance claims', tenantType: 'FINTECH',
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
        description: 'Ryan — uncompensated market commentary', tenantType: 'ALL',
        bodyVariants: [
            'Looked into Apex Growth I after seeing it mentioned online. Interesting structure but do your own due diligence. I have no financial relationship with them. Just sharing thoughts.',
            'General market observations for March. Nothing here is investment advice. I do not promote any specific funds or products. Just my personal analysis of macro trends.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-06', sourcePlatform: 'TWITTER_X', contentType: 'THREAD',
        expectedRisk: 'MEDIUM',
        description: 'Ryan — uncompensated but uses risky language', tenantType: 'ALL',
        bodyVariants: [
            'Thread: Why I think alternatives are going to see huge opportunity in the next 12 months. The macro setup is perfect. Here is my thesis. Not financial advice but I am very bullish.',
            'Hot take thread. The alternative investment space is about to explode. Ground floor opportunity for anyone paying attention. This is not sponsored — just my genuine conviction.',
        ],
    },
    // ══════════════════════════════════════════
    // FINTECH SCENARIOS (5 new)
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CRITICAL',
        description: 'Fintech — app referral with per-account bonus', tenantType: 'FINTECH',
        bodyVariants: [
            'Download MooMoo right now and get a free stock plus up to 4600 dollars in welcome bonuses. Use my code MOOMOO2026 at signup. I get paid when you open and fund your account so we both win. Link in bio.',
            'Best brokerage app of 2026 no cap. MooMoo is giving away free stocks to new users. Use code MOOMOO2026 to claim yours. I earn a commission for every funded account so help a creator out. Download link in bio.',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Fintech — compliant app feature promotion', tenantType: 'FINTECH',
        bodyVariants: [
            'MooMoo earnings calendar walkthrough. Showing you how to use the AI analysis tools. No specific investment recommendations. I am a paid creator for MooMoo. #ad #fintok',
            'How to set up watchlists in MooMoo in 60 seconds. Pure tutorial content. Paid partnership with MooMoo. Not financial advice. #sponsored #investing',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-02', sourcePlatform: 'INSTAGRAM', contentType: 'REEL',
        expectedRisk: 'HIGH',
        description: 'Fintech — commission-free claim without balance', tenantType: 'FINTECH',
        bodyVariants: [
            'Trading is completely free on this platform. Zero fees ever. Why would you pay commissions anywhere else when you can trade for free here. No catches no hidden costs just free money.',
            'Stop paying trading fees. This platform charges absolutely nothing. Completely free to trade stocks options and crypto. Switch now and keep more of your profits.',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Fintech — per-funded-account compliant post', tenantType: 'FINTECH',
        bodyVariants: [
            'Full review of MooMoo as a brokerage platform. Pros cons and honest assessment. I am compensated per funded account so I want to be transparent about that. All investments carry risk. Not financial advice. Consult your advisor.',
            'MooMoo honest review 2026. Fee structure tools customer service and my personal experience. Disclosure: I receive compensation when you open and fund an account through my link. Not financial advice. Trading involves risk of loss.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'HIGH',
        description: 'Fintech — referral earnings claim', tenantType: 'FINTECH',
        bodyVariants: [
            'I have made over 10000 dollars just referring friends to this trading app. The referral program is insane. Every person who signs up and deposits gets a free stock and I get paid. Easiest money I have ever made.',
            'My referral income this month is 3200 dollars from one brokerage app. All I do is share my link. They sign up I get paid. This is passive income on autopilot. No financial advice just showing what works for me.',
        ],
    },
    // ══════════════════════════════════════════
    // RIA SCENARIOS (4 new)
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'INSTAGRAM', contentType: 'IMAGE_POST',
        expectedRisk: 'HIGH',
        description: 'RIA — paid testimonial without required disclosures', tenantType: 'RIA',
        bodyVariants: [
            'Working with this financial advisor has completely transformed my portfolio. My returns are up 30 percent since I started. Best decision I ever made. Highly recommend if you want real results.',
            'Shoutout to my advisor for helping me build serious wealth this year. The strategy they put me on is delivering incredible results. If you want to actually grow your money talk to them.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'INSTAGRAM', contentType: 'IMAGE_POST',
        expectedRisk: 'CLEAN',
        description: 'RIA — compliant paid testimonial', tenantType: 'RIA',
        bodyVariants: [
            'I was compensated for this testimonial. My experience with this advisory firm has been positive. Results not typical and individual results may vary. This is not a guarantee of future performance. All investments involve risk including potential loss of principal. Past performance does not guarantee future results.',
            'Paid testimonial. I have had a good experience working with this advisory team. Your results may vary. This is not investment advice. Compensated reviewer disclosure: I received payment for this post. All investments carry risk.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-05', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'CRITICAL',
        description: 'RIA — endorsement with performance guarantees', tenantType: 'RIA',
        bodyVariants: [
            'This adviser guaranteed me above market returns and they delivered. My portfolio has doubled in 8 months. If you want guaranteed results just like mine talk to them. They know exactly what they are doing. Link in description.',
            'I was told my money would grow at least 20 percent per year and they were right. This advisory firm delivers guaranteed returns that beat everything else. Stop losing money with your current adviser and switch now.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'CLEAN',
        description: 'RIA — flat fee educational content', tenantType: 'RIA',
        bodyVariants: [
            'General thoughts on portfolio diversification in 2026. Not specific advice for any individual. I am compensated by an advisory firm to create educational content. Not a recommendation. All investments carry risk.',
            'Quick thread on asset allocation strategies. This is general education not personalized advice. Disclosure: I am a paid content creator for a registered investment adviser. Consult your advisor before making investment decisions.',
        ],
    },
    // ══════════════════════════════════════════
    // ISSUER SCENARIOS (3 new)
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-02', sourcePlatform: 'INSTAGRAM', contentType: 'REEL',
        expectedRisk: 'HIGH',
        description: 'Issuer — direct offering promotion without BD', tenantType: 'ISSUER',
        bodyVariants: [
            'This Reg A offering is still open and accepting investors. I get paid for every funded account so yes I have skin in the game. The returns projected for this company are incredible. Do not miss this window. Link in bio to invest directly.',
            'Invest directly in this company through their Reg A offering. No broker needed. I earn a referral fee per investor so transparency matters to me. Early investors are seeing strong growth. Sign up now before the round closes.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Issuer — compliant flat fee offering promotion', tenantType: 'ISSUER',
        bodyVariants: [
            'Reg A offering overview. What it is who can invest and what the risks are. I receive a flat fee for this content. Not investment advice. Read the offering circular before investing. All investments carry risk including total loss of principal.',
            'Breaking down this Reg A offering for non-accredited investors. Eligibility minimum investment and key risk factors from the offering circular. Compensated content creator. Not a recommendation. Invest only what you can afford to lose.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'MEDIUM',
        description: 'Issuer — testing the waters communication', tenantType: 'ISSUER',
        bodyVariants: [
            'We are gauging interest in our upcoming Reg A offering. This is not an offer to sell securities. We are testing the waters under Rule 255 to see if there is investor interest. No money is being solicited at this time. The projected growth for our company looks promising.',
            'Preliminary interest check for our planned Reg A offering. This is a testing the waters communication. No securities are being offered or sold. We believe this opportunity could offer strong returns based on our growth trajectory. More details coming soon.',
        ],
    },
    // ══════════════════════════════════════════
    // REG_CF SCENARIOS (3 new)
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-02', sourcePlatform: 'INSTAGRAM', contentType: 'IMAGE_POST',
        expectedRisk: 'HIGH',
        description: 'Reg CF — portal promoter solicitation', tenantType: 'REG_CF',
        bodyVariants: [
            'This crowdfunding campaign is blowing up. I get paid for every funded investor and honestly this company deserves it. The growth potential is unreal. Invest now through the portal before the round closes. Link in bio.',
            'Backed this company on the crowdfunding portal and you should too. I earn a commission for referrals so full transparency. But even without that I believe in this business. Do not miss this round. Invest through the link in my bio.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'CLEAN',
        description: 'Reg CF — compliant campaign post', tenantType: 'REG_CF',
        bodyVariants: [
            'Interesting Reg CF offering on the portal right now. Non-accredited investors can participate subject to investment limits. Read the Form C carefully before investing. I receive a flat fee for this post. Not investment advice. You can lose your entire investment.',
            'New Reg CF campaign live on the portal. Open to non-accredited investors with annual limits that apply. Review all offering documents before investing. Compensated creator. All investments carry risk of total loss. #crowdfunding #ad',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'MEDIUM',
        description: 'Reg CF — investment limit omission', tenantType: 'REG_CF',
        bodyVariants: [
            'This crowdfunding deal is open to everyone. You do not need to be accredited. Just go to the portal and invest as much as you want. The company is growing fast and I think this is going to be huge. Paid creator but I genuinely believe in this.',
            'Anyone can invest in this Reg CF offering. No accreditation required. Put in whatever amount feels right. I think this company has massive upside. Disclosure: paid content. Not financial advice.',
        ],
    },
    // ══════════════════════════════════════════
    // MOOMOO TEST — FINTECH scenarios
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CRITICAL',
        description: 'Fintech — account opening solicitation + urgency + referral', tenantType: 'FINTECH',
        bodyVariants: [
            'Open a Moomoo account with my link and get 5 free stocks — limited time! Use my code MOOMOO2026 before the offer ends. I have been using this platform for months and it is incredible.',
            'Sign up with my link for Moomoo and get free stocks when you sign up! Bonus expires this Friday. Use my code MOOMOO2026. This is the best trading platform I have used. Act now before the promotion ends.',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'MEDIUM',
        description: 'Fintech — commission-free claim without disclosure', tenantType: 'FINTECH',
        bodyVariants: [
            'Commission-free trading on Moomoo — I switched and never looked back. The interface is clean, execution is fast, and you do not pay any fees. Compared to my old broker this is a game changer.',
            'I trade on Moomoo because there are no fees and no commissions. Free trading is real. I moved my whole portfolio over last month and the experience has been seamless. Zero commission means more money stays in my account.',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'HIGH',
        description: 'Fintech — personal performance claims', tenantType: 'FINTECH',
        bodyVariants: [
            'I made $847 last week using Moomoo options tools. My portfolio is up 23% this quarter. DM me for my strategy. This platform gives you everything you need to start earning.',
            'My returns this month are insane. I have been making consistent profits using Moomoo paper trading and now real money. Earning every week. This is what passive income looks like.',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Fintech — compliant balanced review', tenantType: 'FINTECH',
        bodyVariants: [
            'Moomoo is the best trading app I have used #ad #paid — here is my honest review. The platform has great charting tools and level 2 data. However, options trading carries significant risk and you can lose your entire investment. Past performance does not guarantee future results. I am compensated for this content.',
            'Full review of Moomoo trading platform. #sponsored I am paid to create this content. The platform offers competitive pricing though investors should understand that all trading involves risk of loss. This is not financial advice. Results are not typical and individual outcomes will vary.',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CRITICAL',
        description: 'Fintech — promissory language + solicitation + referral', tenantType: 'FINTECH',
        bodyVariants: [
            'You will profit with this strategy. Use my code MOOMOO2026 and start making money today. This proven strategy works every time. Open an account now before the bonus expires.',
            'This is a proven strategy that always works. Sign up with my link and start making money immediately. Use my code MOOMOO2026. You will profit from day one. Guaranteed results if you follow my system.',
        ],
    },
    // ══════════════════════════════════════════
    // ADDITIONAL CLEAN/LOW SCENARIOS — rebalance to ~65% clean
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'CLEAN',
        description: 'Derek — compliant market commentary', tenantType: 'ALL',
        bodyVariants: [
            'Interesting day in the markets. Here is my take on what happened with tech earnings. No specific recommendations — just observations. #sponsored This is paid content. Not financial advice.',
            'Weekly market recap. Some interesting moves in the index funds space this week. Past performance does not guarantee future results. All investments carry risk. I am compensated for this content.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-06', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'CLEAN',
        description: 'Ryan — compliant platform mention', tenantType: 'ALL',
        bodyVariants: [
            'Just published a new article on the basics of index fund investing. Link in bio. Disclosure: I am not compensated for this post and have no financial interest in any products mentioned.',
            'Sharing my latest blog post about emergency funds and why they matter. No financial products promoted. This is educational content only. All opinions are my own.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Nina — compliant educational content', tenantType: 'ALL',
        bodyVariants: [
            'What is a 401k and why does it matter? Let me break it down simply. This is educational content — not financial advice. I am paid to create content for this platform. All investing involves risk.',
            'Three things I wish I knew about investing before I started. This is general education only. #ad I am compensated for this content. Please consult a financial advisor before making any investment decisions.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-05', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Priya — compliant fund update with all disclosures', tenantType: 'BD',
        bodyVariants: [
            'Meridian Tech L/S Q1 update. The fund returned 4.2% in Q1 against a benchmark of 3.8%. Past performance does not guarantee future results. All investments carry risk of principal loss. I receive compensation for this content. This is not financial advice. Results are not typical.',
            'Here is the quarterly update for Meridian Tech L/S. Performance data is audited and verified. I am compensated as a promoter for this fund. This is not financial advice and past results do not indicate future performance. All investments may lose value.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'THREAD',
        expectedRisk: 'CLEAN',
        description: 'Derek — compliant thread about diversification', tenantType: 'ALL',
        bodyVariants: [
            'Thread: Why diversification matters more than stock picking. 1/ Most retail investors underperform the market. 2/ Broad index funds historically deliver competitive returns. 3/ Concentration risk is real. This is educational — not financial advice. I receive no compensation for this thread.',
            'Thread on asset allocation basics. 1/ No single asset class always wins. 2/ Rebalancing is important but often overlooked. 3/ Time in market beats timing the market. General education only. No products promoted. Not compensated.',
        ],
    },
    // ══════════════════════════════════════════
    // ISSUER — Direct Reg A+ issuer scenarios
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'INSTAGRAM', contentType: 'IMAGE_POST',
        expectedRisk: 'CRITICAL',
        description: 'Issuer — testing the waters violation + offering term misrep', tenantType: 'ISSUER',
        bodyVariants: [
            'Get in early before this offering goes public — reserve your shares now at the lowest price before qualification. Anyone can invest. Get in for just $100.',
            'Pre-offering access to this Reg A+ deal — invest before we launch. Open to all investors. Coming soon to investors at exclusive pricing.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'HIGH',
        description: 'Issuer — capability claim with disclosure', tenantType: 'ISSUER',
        bodyVariants: [
            "Their patented AI technology has no competition — this is a revolutionary product breakthrough. I receive a referral fee for this post #ad. Past performance does not guarantee future results.",
            "Proprietary algorithm that's first of its kind in the market — exclusive technology with no competition. Sponsored content — I am compensated by the issuer. Not financial advice.",
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'CRITICAL',
        description: 'Issuer — fabricated traction + no disclosure', tenantType: 'ISSUER',
        bodyVariants: [
            'This company has 500,000 customers and is growing 40% per month — explosive growth. Use my link to invest. Market leader in their space.',
            'Fastest growing company I have seen — million customers, record revenue, dominating the market. Industry leader. Use my link below.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Issuer — compliant balanced post with full disclosure', tenantType: 'ISSUER',
        bodyVariants: [
            "Vertex Real Assets is a Reg A+ offering. I receive a referral fee for this post. Key risks include real estate market volatility, illiquidity, and potential loss of principal. Minimum investment $500. Visit the offering page for full details. Not financial advice. Past performance does not guarantee future results.",
            "Sharing my honest review of this Reg A+ offering. #ad I am compensated by the issuer. Risks: early-stage company, illiquid investment, potential total loss of principal. Read the Form 1-A before investing. Not financial advice.",
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-04', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CRITICAL',
        description: 'Issuer — pure upside framing (anti-fraud signal)', tenantType: 'ISSUER',
        bodyVariants: [
            'Safe investment opportunity — can only go up with real assets backing every dollar. Guaranteed growth in today market. No downside.',
            'Sure thing investment — secure investment with no downside. Risk-free opportunity. Protected investment guaranteed by real assets. Can only go up.',
        ],
    },
    // ══════════════════════════════════════════
    // FINTECH — TikTok performance + urgency scenario
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CRITICAL',
        description: 'Fintech TikTok — POV performance + urgency + referral', tenantType: 'FINTECH',
        bodyVariants: [
            'POV: you started with $500 last month and now look at this 👀 use code MOOMOO2026 to open your account today — offer expires Friday 🔥',
            'POV: $500 last month → look at my returns now 📈 sign up with my link MOOMOO2026 before the bonus expires 🔥 limited time offer',
        ],
    },
    // ══════════════════════════════════════════
    // REG CF — Wefunder/Republic-style scenarios
    // ══════════════════════════════════════════
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'CRITICAL',
        description: 'Reg CF — portal-prohibited solicitation', tenantType: 'REG_CF',
        bodyVariants: [
            "You should invest in this campaign — it's the best investment opportunity I've seen this year! Link in bio. I recommend investing before it closes.",
            "I'm investing in this Reg CF offering and you need to invest too. This is a good investment. Link in my bio to the campaign.",
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'INSTAGRAM', contentType: 'IMAGE_POST',
        expectedRisk: 'CRITICAL',
        description: 'Reg CF — equity solicitation + urgency + referral', tenantType: 'REG_CF',
        bodyVariants: [
            'Own equity in a real company for as little as $100 — campaign closes Friday! Use my referral link to become an investor before the campaign ending soon.',
            'Become a shareholder in this growing startup — invest as little as $100. Last chance to invest, almost fully funded! Use my link.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TWITTER_X', contentType: 'TWEET',
        expectedRisk: 'CRITICAL',
        description: 'Reg CF — investment limit misrepresentation', tenantType: 'REG_CF',
        bodyVariants: [
            'Invest as much as you want in this Reg CF offering — no limits! #ad I am compensated for this content.',
            'No limit on investment in this campaign — invest any amount. Disclosure: paid creator. Not financial advice.',
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Reg CF — compliant balanced post with disclosure', tenantType: 'REG_CF',
        bodyVariants: [
            "Check out this Reg CF campaign I'm supporting — full disclosure: I receive a referral fee. Here are the key risks: early-stage companies have high failure rates, your investment is illiquid, and you should only invest what you can afford to lose. Reg CF investment limits apply to non-accredited investors. Not financial advice.",
            "Sharing a Reg CF offering on the Republic portal. Disclosure: paid creator. Risks include illiquidity, total loss of capital, and limited information available compared to public companies. Investment limits apply per Reg CF rules. This is educational only.",
        ],
    },
    {
        ambassadorId: 'AMB-DEMO-03', sourcePlatform: 'TIKTOK', contentType: 'SHORT_FORM_VIDEO',
        expectedRisk: 'HIGH',
        description: 'Reg CF — misleading issuer capability claims', tenantType: 'REG_CF',
        bodyVariants: [
            "Their proprietary technology is unlike anything else in the market — patented technology that's revolutionary. The only platform of its kind. Proven business model. #ad",
            'This company has patented technology and a proven business model. Revolutionary technology in their space — only platform of its kind. Sponsored content.',
        ],
    },
    {
        ambassadorId: 'AMB-MOOMOO-TEST', sourcePlatform: 'YOUTUBE', contentType: 'VIDEO',
        expectedRisk: 'CLEAN',
        description: 'Fintech — compliant feature walkthrough', tenantType: 'FINTECH',
        bodyVariants: [
            'Walking through Moomoo charting features today. #ad I am compensated for this content. This is a platform review only — not investment advice. Trading involves risk and you may lose money. Results shown are for educational purposes only and are not typical.',
            'Moomoo desktop app tour — showing you the tools I use for research. Paid promotion. I receive compensation from Moomoo. This is not financial advice. All trading carries risk of loss. Past performance is not indicative of future results.',
        ],
    },
];
/**
 * Pick N random scenarios from the pool, selecting a random variant
 * for each. Returns ready-to-ingest content record inputs.
 */
function pickRandomScenarios(count, tenantType) {
    // Filter by tenant type if provided
    let pool = exports.SCENARIO_POOL;
    if (tenantType && tenantType !== 'ALL') {
        const tt = tenantType.toUpperCase();
        pool = exports.SCENARIO_POOL.filter(s => s.tenantType === tt || s.tenantType === 'ALL');
        // Fall back to full pool if filter yields too few
        if (pool.length < count)
            pool = exports.SCENARIO_POOL;
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
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