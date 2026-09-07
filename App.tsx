import React, { useState, useEffect, useRef, useMemo } from "react";
import { Eye, EyeOff, Flame, Lock, CheckCircle2, Clock, Target, Brain, Zap, Lightbulb, Trophy, BarChart3, Play, Pause, RotateCcw, Download, AlertTriangle, Search, BookOpen, Swords, GraduationCap, Star, Timer, Award } from "lucide-react";

const BG = "#fbfaf8";
const CARD_BORDER = "#e8e6e1";

// --- CORE CASE DATA (unchanged) ---
const CASE_DATA = {
  id: 3,
  title: "NYC Parking — How many private cars parked overnight?",
  client: "NYC DOT • Market Sizing",
  situation: "Mayor asks how many private cars are parked on streets overnight. Need estimate for new curb pricing pilot in Manhattan.",
  checking: "Unit conversion + filtering — households, not people",
  interviewerData: { pop: "8.8M people", hhSize: "2.5 / HH", ownRate: "45% own car", carsPer: "1.33 cars / owning HH" },
  approach: "Start with unit: households, not people. Why? Cars owned per HH, not per person. Structure: 1) Pop → Households = Pop / avg HH size. 2) Filter owning HH = HH × % own. 3) Cars = owning HH × cars per owning HH. Sanity: NYC ~2M cars feels right vs ~3.5M HH.",
  hints: [
    { tier: 1, label: "Free • Socratic", text: "Who actually owns a car — a person or a household? What does that imply for your first step?", cost: 0 },
    { tier: 2, label: "Costs 1 token • Trap + Skeleton", text: "Trap: 8.8M × 0.6 = wrong unit. People / ___ = HH. Then HH × ___ = owning HH", cost: 1 },
    { tier: 3, label: "Costs 1 token • Fill blanks", text: "___M / 2.5 = ___M HH × 0.45 = ___M owning × 1.33 = ___M cars", cost: 1 },
  ],
  solution: {
    math: "8.8M / 2.5 = 3.52M HH × 0.45 = 1.584M owning HH × 1.33 cars/HH = 2.11M cars",
    steps: ["3.52M HH total", "1.58M own a car", "2.11M private cars"],
    trap: "Using 8.8M people directly × 0.6 ownership = 5.28M — overcounts, unit error.",
    lens: "Strong: clarifies unit, asks HH size. Weak: jumps to people × %. MBB listens for unit hygiene.",
    framework: "Conversion + Behavior filter (Pop → HH → Owning → Cars)",
    time: "Strong: <90s structure, <60s math. Target: 2m10s total",
  },
  mcq: {
    q: "If avg HH size drops to 2.0, what happens to car estimate (holding % constant)?",
    opts: ["Decreases", "Increases", "Same", "Need more info"],
    ans: 1,
    exp: "More HH = 8.8/2 = 4.4M vs 3.52M → more cars. Shows you track denominator.",
  },
};

// --- 25 CONCEPTS LIBRARY ---
const CONCEPTS_DATA = [
  { id:"mece", name:"MECE", when:"Structure any ambiguous problem", struct:"Mutually Exclusive, Collectively Exhaustive", ex:"Break profit into Rev & Cost, not Rev & Price", trap:"Overlapping buckets — double counting", drill:{q:"Is 'Price, Volume, Cost' MECE for profit?", a:"No — Price×Vol=Rev, but Rev vs Cost is MECE"} , icon:"🧩" },
  { id:"pyramid", name:"Pyramid Principle", when:"Communicate answer-first", struct:"Conclusion → 3 supporting reasons → Data", ex:"Answer: Enter. Because market $500M, 20% share, WTP $30", trap:"Burying lead at end", drill:{q:"What goes on top?", a:"Your recommendation, not your process"} , icon:"🔺" },
  { id:"issue-hyp", name:"Issue vs Hypothesis Tree", when:"Decide exploration vs testing", struct:"Issue: What could cause X? Hypothesis: X because Y", ex:"Issue: sales down → funnel? Hypothesis: churn due to price", trap:"Using hypothesis tree when you don't know causes", drill:{q:"Client has no clue why profit down — which tree?", a:"Issue tree"} , icon:"🌳" },
  { id:"80-20", name:"80/20 Principle", when:"Prioritize high-impact branches", struct:"20% causes → 80% effect", ex:"80% churn from 20% enterprise clients", trap:"Analyzing all branches equally", drill:{q:"2M SKUs, 15% drive 80% rev — what to size?", a:"Focus on top SKUs first"} , icon:"⚡" },
  { id:"3c", name:"3C", when:"Market entry / competitive", struct:"Company-Customer-Competitor", ex:"Should Uber enter scooter? Check unit econ + WTP + Lime share", trap:"Forget Customer willingness", drill:{q:"Missing C that kills most entries?", a:"Customer — WTP / need"} , icon:"◐" },
  { id:"4p", name:"4P", when:"Marketing / launch plan", struct:"Product Price Place Promotion", ex:"Starbucks new drink: recipe, $6, stores, Instagram", trap:"Mix Price with Cost", drill:{q:"Where does margin live?", a:"Not in 4P — need cost overlay"} , icon:"📦" },
  { id:"porter", name:"Porter 5 Forces", when:"Industry attractiveness", struct:"Rivalry, Suppliers, Buyers, New entrants, Subs", ex:"Airlines: high rivalry, high buyer power, low supplier (fuel)", trap:"Checklist with no insight", drill:{q:"Soft-drinks — strongest force?", a:"Rivalry Coke vs Pepsi"} , icon:"⚔️" },
  { id:"valuechain", name:"Value Chain", when:"Cost or differentiation edge", struct:"Inbound → Ops → Outbound → Marketing → Service", ex:"Zara: fast ops + outbound = edge", trap:"Map but don't find bottleneck", drill:{q:"Where does SaaS make margin?", a:"Ops (low) + Marketing (high LTV)"} , icon:"⛓️" },
  { id:"bcg", name:"BCG Matrix", when:"Portfolio allocation", struct:"Stars, Cash Cows, ?, Dogs (Growth vs Share)", ex:"iPhone = Cash Cow, Vision Pro = ?", trap:"Treat as static", drill:{q:"Low share low growth =?", a:"Dog — divest"} , icon:"⭐" },
  { id:"profit", name:"Profit Tree", when:"Profit / revenue decline", struct:"Profit=Rev-Cost, Rev=Price×Vol, Cost=Fixed+Var", ex:"Airline profit down: Rev per seat × Load - Fuel", trap:"Jump to cost only", drill:{q:"Rev down — Price or Vol?", a:"Isolate both"} , icon:"💰" },
  { id:"bizsit", name:"Business Situation", when:"Classic strategy cases", struct:"Customer-Company-Competitor-Product-Econ", ex:"Market entry: 3C + economics", trap:"Forcing 3C when not fit", drill:{q:"When use full list?", a:"Broad strategy, no clear structure"} , icon:"🏢" },
  { id:"sizing", name:"Market Sizing Top/Bottom", when:"Estimate market size", struct:"Top: Pop→filter, Bottom: Stores×sales", ex:"Coffee cups/day: pop×%drink vs Starbucks stores×cups", trap:"No sanity check", drill:{q:"Sanity for NYC cars?", a:"~2M feels right vs 3.5M HH"} , icon:"📏" },
  { id:"conversion", name:"Estimation Conversion Chain", when:"Chain of % filters", struct:"Base → % → % → value (Pop→HH→Own→Cars)", ex:"NYC 8.8M/2.5=3.52M×0.45×1.33", trap:"Unit error — people vs HH", drill:{q:"Why HH not people?", a:"Cars owned per HH"} , icon:"🔗" },
  { id:"be", name:"Break-even & Unit Econ", when:"Viability check", struct:"BE=FC/(P-VC), Contrib=Price-Var", ex:"FC120k P15 VC7 → BE 15k units", trap:"Use revenue not contribution", drill:{q:"P15 VC7 FC120k BE?", a:"15k"} , icon:"⚖️" },
  { id:"pricing", name:"Pricing Frameworks", when:"Set optimal price", struct:"Cost+/Value/Willingness/Competitive", ex:"SaaS: value-based $50 vs cost $10", trap:"Cost+ leaves money", drill:{q:"Luxury good — which?", a:"Value + Competitive"} , icon:"🏷️" },
  { id:"ansoff", name:"Growth Strategies (Ansoff)", when:"Where to grow", struct:"Market Pen, Product Dev, Market Dev, Diversify", ex:"Starbucks: new drink = product dev", trap:"Diversify too early", drill:{q:"Same product new geo?", a:"Market dev"} , icon:"📈" },
  { id:"ma", name:"M&A Merger Math", when:"Should we acquire?", struct:"Synergy - Premium >0? Accretion/Dilution", ex:"$100M rev +30% cross-sell - $20M premium", trap:"Assume synergies = real", drill:{q:"Quick accretion test?", a:"Combined EPS > standalone?"} , icon:"🤝" },
  { id:"npv", name:"NPV & IRR Quick Check", when:"Investment yes/no", struct:"NPV= Σ CF/(1+r)^t - Inv, IRR where NPV0", ex:"$100 now, $120 in 1y at 10% → NPV 9", trap:"Ignoring time value", drill:{q:"Rule72 at 8% double?", a:"9 years"} , icon:"⏳" },
  { id:"seg", name:"Customer Segmentation", when:"Tailor offer", struct:"Demographic, Behavioral, Need, Value", ex:"Airline: biz vs leisure WTP $800 vs $200", trap:"Segment but same product", drill:{q:"Best for pricing?", a:"WTP-based need segment"} , icon:"👥" },
  { id:"ltv", name:"Funnel & LTV/CAC", when:"Growth health", struct:"Aware→Convert→Retain, LTV=CAC×3 healthy", ex:"SaaS: CAC $100, LTV $500 = 5x good", trap:"Ignore churn in LTV", drill:{q:"LTV formula?", a:"ARPU×Gross / Churn"} , icon:"🔻" },
  { id:"supplydemand", name:"Supply-Demand Shifts", when:"Price dynamics", struct:"Supply ↑ price ↓, Demand ↑ price ↑", ex:"Gasoline case: refinery outage → supply ↓ price ↑", trap:"Move along curve vs shift", drill:{q:"Refinery fire — which curve?", a:"Supply left shift"} , icon:"📊" },
  { id:"scale", name:"Economies of Scale", when:"Cost advantage", struct:"Fixed spread over volume, learning curve", ex:"Tesla: battery cost down 20% per doubling", trap:"Assume scale always wins", drill:{q:"Diseconomy example?", a:"Coordination cost at huge size"} , icon:"🏭" },
  { id:"leverage", name:"Fixed vs Variable Leverage", when:"Risk & operating leverage", struct:"High FC = high leverage = profit swings", ex:"Airline high FC → small load drop = big loss", trap:"Mix accounting fixed with econ", drill:{q:"SaaS leverage?", a:"High FC dev, near-zero VC"} , icon:"🎚️" },
  { id:"hypothesis", name:"Hypothesis-Driven", when:"Speed in interviews", struct:"Form hypothesis → test with data → iterate", ex:"Profit down → hyp: price cut caused vol loss?", trap:"Falling in love with hyp", drill:{q:"First step?", a:"State testable hypothesis"} , icon:"🧪" },
  { id:"behavioral", name:"Behavioral Filters", when:"Market sizing realism", struct:"Pop × awareness × able × willing × access", ex:"NYC cars: HH×45% own (behavior) ×1.33", trap:"Use 100% adoption", drill:{q:"Electric car adoption filter?", a:"% who can charge + WTP"} , icon:"🧠" },
];

const CHALLENGES_DATA = [
  { id:1, type:"micro", title:"How many Ubers active in NYC now?", diff:"Easy", time:"5 min", xp:20, desc:"Fermi — active drivers at 6pm", q:"NYC 8.8M, 1M trips/day, avg 2 trips/hr/driver. How many drivers active?", approach:"Trips/day→trips/hour→drivers = 1M/24≈42k per hr /2≈21k active", ans:"~15-25k active at peak, ~8k off-peak", trap:"Assume all registered drivers active" },
  { id:2, type:"micro", title:"Daily coffee cups in Manhattan?", diff:"Easy", time:"5 min", xp:20, desc:"Office workers + tourists", q:"Estimate cups", approach:"1.6M workers×60% drink×1.5 cups + 200k tourists×30% = ~1.5M", ans:"~1.2-1.8M", trap:"Forget tourists or double count" },
  { id:3, type:"battle", title:"Coffee chain profit down 12%", diff:"Medium", time:"25 min", xp:50, desc:"Weekly Battle — diagnose root cause", q:"Chain 200 stores, same-store sales -8%, COGS +5%. Structure?", approach:"Profit Tree: Rev=Price×Vol, Vol=Footfall×Conversion. Check COGS driver: milk +30%. Test price vs vol.", ans:"Footfall down due to remote + milk cost spike. Actions: loyalty + supplier reneg.", trap:"Jump to cost only" },
  { id:4, type:"battle", title:"SaaS churn spike from 5% to 9%", diff:"Hard", time:"25 min", xp:50, desc:"B2B SaaS 500 clients, SMB churn 15%", q:"Diagnose", approach:"Segment: SMB vs Enterprise. Funnel: onboarding delay + support tickets 2x. LTV/CAC now 2x not 4x", ans:"Onboarding bottleneck for SMB. Fix: self-serve + health scores", trap:"Average churn hides SMB" },
  { id:5, type:"blitz", title:"Math Blitz — 60-sec 10 Qs", diff:"Hard", time:"1 min", xp:30, desc:"Rapid fire — beat your best", q:"10 Qs: 12.5% of 640? BE 120k P15 VC7? 72/8? etc", approach:"Use tricks: 1/8, FC/(P-VC), Rule72", ans:"80, 15k, 9y...", trap:"No calc, use fractions" },
  { id:6, type:"fermi", title:"Fermi Friday #1 — Elevators in Empire State", diff:"Medium", time:"10 min", xp:30, desc:"How many elevator trips/day?", q:"102 floors, 73 elevators, 4k workers + tourists", approach:"Workers 2 trips + tourists 1 + service → ~15k trips/day", ans:"~10-20k", trap:"Assume each person uses elevator once" },
  { id:7, type:"micro", title:"How many gasoline gallons used in US daily?", diff:"Medium", time:"5 min", xp:20, desc:"Link to refinery supply shift case", q:"Cars + trucks", approach:"280M cars×1.5 gal/day avg + trucks = ~370M gal/day", ans:"~350-400M gal", trap:"Forget trucks or mileage" },
  { id:8, type:"fermi", title:"Fermi Friday #2 — Pizzas in NYC per night", diff:"Easy", time:"8 min", xp:30, desc:"Friday night demand", q:"Estimate", approach:"8.8M×20% order pizza×1 per 2.5 people ≈ 700k pizzas", ans:"~500k-800k", trap:"Assume whole city eats pizza" },
  { id:9, type:"battle", title:"Airline new route: profitable?", diff:"Hard", time:"25 min", xp:50, desc:"Load factor breakeven", q:"Cost $50k/flight, 150 seats, $200 avg fare", approach:"BE load = 50k/(200-30 var) ≈ 294? Wait compute: need 250 seats? Actually 50k/170≈294 seats → need >150 so no. Check ancillary.", ans:"Not profitable at 150 seats — need $340 fare or 90%+ load", trap:"Ignore variable cost" },
  { id:10, type:"blitz", title:"Math Blitz — Pricing", diff:"Medium", time:"1 min", xp:30, desc:"Break-even + margins", q:"Quick", approach:"Contrib tricks", ans:"See explanations", trap:"Slow math" },
  { id:11, type:"fermi", title:"Fermi Friday #3 — Spotify streams per day", diff:"Medium", time:"10 min", xp:30, desc:"Global", q:"600M users×?", approach:"600M×40% daily×20 songs = 4.8B", ans:"~3-5B", trap:"Assume all users daily" },
  { id:12, type:"micro", title:"How many private cars parked overnight? (Redo)", diff:"Easy", time:"5 min", xp:20, desc:"Same as Day 3 — beat time", q:"8.8M/2.5×0.45×1.33", approach:"Households unit hygiene", ans:"2.11M", trap:"People vs HH" },
];

const MODULES_DATA = [
  { id:1, title:"Foundations", desc:"MECE, Issue Trees, Pyramid, Hypothesis-driven", xp:60, lessons:[
    { t:"MECE — No Overlap, No Gap", c:"Structure problems so buckets don't overlap and cover all.", ex:"Profit = Revenue + Cost (not Price). Price×Vol double counts if mixed.", try:"Break 'Why sales down?' into 2 MECE branches.", approach:"Branch: Demand (footfall, conversion, price) vs Supply (stock, capacity)", exp:"Good MECE covers all causes without overlap. Test by checking if categories intersect." , quiz:[{q:"Which is MECE for Revenue?", opts:["Price+Cost","Price×Vol","Price+Vol"], a:1},{q:"MECE fails when?", opts:["Too many branches","Overlap","Too few"], a:1}] },
    { t:"Issue Trees — Map the Unknown", c:"When you don't know cause, map all possible issues.", ex:"Sales down → footfall? conversion? price? product?", try:"Create issue tree for 'User churn up'", approach:"Churn = onboarding? product bug? price? support? competition?", exp:"Issue tree explores, hypothesis tree tests. Use issue when ambiguous.", quiz:[{q:"When use Issue Tree?", opts:["Know cause","Don't know cause","Test hypothesis"], a:1},{q:"Root of issue tree?", opts:["Profit","Problem statement","Solution"], a:1}] },
    { t:"Pyramid Principle — Answer First", c:"Lead with answer, then 2-3 reasons, then data.", ex:"Recommendation: Don't enter. Because market small, WTP low, competition strong.", try:"Pyramid 'Should we raise price?'", approach:"Yes, raise 10% because: inelastic, cost up, competitors raised.", exp:"MBB loves pyramid — saves partner time. Always start with So What.", quiz:[{q:"Top of pyramid?", opts:["Data","Recommendation","Process"], a:1},{q:"How many reasons ideal?", opts:["1","2-3","5+"], a:1}] },
    { t:"Hypothesis-Driven — Fast Test", c:"Form quick hypothesis and test with data.", ex:"Hyp: profit down due to price cut. Test: did price drop? yes 10% vol only +2%", try:"Hyp for coffee chain profit down?", approach:"Hyp: milk cost + footfall down. Test milk invoices + traffic data.", exp:"Speed > perfection. State hyp, say what data would prove/disprove.", quiz:[{q:"Danger of hyp-driven?", opts:["Slow","Falling in love with hyp","No structure"], a:1},{q:"First step?", opts:["Data","Hypothesis","Conclusion"], a:1}] },
  ]},
  { id:2, title:"Market Sizing Mastery", desc:"Top-down, Bottom-up, Conversion chains, Sanity, Behavioral filters", xp:80, lessons:[
    { t:"Top-Down Sizing", c:"Start with big pop then filter with %.", ex:"US coffee market: 330M×60% drink×2 cups×365×$4", try:"Size US gasoline daily", approach:"Cars 280M×12k miles/25mpg=.../365≈350M gal", exp:"Top-down fast but needs good filters. Always state assumptions.", quiz:[{q:"Top-down starts with?", opts:["Stores","Population","Revenue"], a:1},{q:"Key risk?", opts:["Too precise","Bad filters","Slow"], a:1}] },
    { t:"Bottom-Up Sizing", c:"Count units × value per unit.", ex:"Starbucks revenue: 16k stores×500 cups/day×$6", try:"Bottom-up NYC Ubers", approach:"Uber drivers active 20k×2 trips/hr×10hr×$20", exp:"Bottom-up more accurate if unit data good. Cross-check with top-down.", quiz:[{q:"Bottom-up uses?", opts:["Pop","Unit count×value","%"], a:1},{q:"Best when?", opts:["No unit data","Good unit data","Ambiguous"], a:1}] },
    { t:"Conversion Chains", c:"Pop→HH→Owning→Cars chain hygiene.", ex:"NYC 8.8M/2.5=3.52M×0.45×1.33=2.11M", try:"Size households owning bikes NYC", approach:"3.52M HH×30% own×1.2 bikes/HH", exp:"Units must match next step. People vs HH is classic trap.", quiz:[{q:"Why HH not people for cars?", opts:["People own","HH owns car","Easier"], a:1},{q:"Conversion order matters?", opts:["Yes","No"], a:0}] },
    { t:"Behavioral Filters", c:"Not everyone who can, will.", ex:"45% own car in NYC vs 90% US — behavior filter", try:"Filter EV adoption", approach:"% aware × able to charge × WTP × access", exp:"Behavioral = willingness + ability. Use NYC 45% as example of filter.", quiz:[{q:"Behavioral filter example?", opts:["Pop","% own","HH size"], a:1},{q:"Without filter you?", opts:["Undercount","Overcount","Accurate"], a:1}] },
    { t:"Sanity Checks", c:"Does answer feel right? Benchmark.", ex:"2.11M cars in NYC — 3.52M HH, 45% own, ~1.3 each — feels right vs street parking chaos", try:"Sanity your sizing", approach:"Compare to known: NYC 2M cars vs 1M street spots = tight = plausible", exp:"Always sanity: too high/low? Compare to adjacent markets.", quiz:[{q:"Sanity uses?", opts:["Gut","Benchmarks","Both"], a:2},{q:"When to do?", opts:["Start","End","Both"], a:2}] },
  ]},
  { id:3, title:"Profitability Deep Dive", desc:"Profit Tree, Cost structure, Pricing, BE, Unit econ", xp:70, lessons:[
    { t:"Profit Tree Root", c:"Profit = Rev - Cost. Rev = Price×Vol. Cost=Fixed+Var.", ex:"Airline: Rev per seat × load - fuel+crew", try:"Tree for SaaS profit down", approach:"Rev: MRR×clients, Cost: CAC+Support. Check churn vs CAC.", exp:"Always start with tree, don't jump to cost.", quiz:[{q:"First split profit?", opts:["Price/Cost","Rev/Cost","Vol/Cost"], a:1},{q:"Rev = ?", opts:["Cost×Vol","Price×Vol","Price-Cost"], a:1}] },
    { t:"Break-even Mastery", c:"BE=FC/(P-VC). Contrib margin key.", ex:"FC120k P15 VC7 → 15k units", try:"SaaS BE with $50k FC 70% margin", approach:"BE $ = FC/margin% = 50k/0.7≈71k MRR", exp:"Use contribution, not revenue. High FC = risky.", quiz:[{q:"BE 200k FC P40 VC24", opts:["10k","12.5k","15k"], a:1},{q:"High FC means?", opts:["Low leverage","High leverage","No leverage"], a:1}] },
    { t:"Unit Economics", c:"LTV, CAC, Payback, Contrib per unit.", ex:"LTV $500 CAC $100 payback 6mo healthy", try:"Coffee unit econ", approach:"Price $6 - VC $2 = $4 contrib × 200 cups/day = $800/day", exp:"Unit econ tells if biz scales. Negative = no scale.", quiz:[{q:"Healthy LTV/CAC?", opts:["1x","3x+","0.5x"], a:1},{q:"Payback ideal?", opts:["<12mo","36mo","60mo"], a:0}] },
  ]},
  { id:4, title:"Pricing & Growth", desc:"WTP, Elasticity, Ansoff, Funnel", xp:60, lessons:[
    { t:"Willingness to Pay", c:"Value-based > cost-plus.", ex:"Pharma: cost $10 price $1000 because value = life", try:"Price Spotify family plan", approach:"WTP $15 individual × 1.5 convenience = $22 family", exp:"Ask what customer pays for alternative + value.", quiz:[{q:"Best pricing for luxury?", opts:["Cost+","Value","Competitive"], a:1},{q:"WTP discovery?", opts:["Guess","Interviews+tests","Cost"], a:1}] },
    { t:"Ansoff Growth", c:"Pen, Product, Market, Diversify.", ex:"Starbucks new size = penetration, new country = market dev", try:"Ansoff for Uber eats", approach:"Same market new product = product dev", exp:"Risk increases clockwise: pen safest.", quiz:[{q:"Same product new geo?", opts:["Pen","Market dev","Product dev"], a:1},{q:"Highest risk?", opts:["Pen","Diversify","Market dev"], a:1}] },
    { t:"Funnel Optimization", c:"Aware→Interest→Convert→Retain. Find bottleneck.", ex:"Ecom 100k visit 2% conv = 2k orders, fix conv to 3% = 3k", try:"Funnel for SaaS", approach:"1000 trials 20% conv =200, churn 10% → focus conv", exp:"Math: small funnel lift = big rev.", quiz:[{q:"Funnel bottleneck is lowest?", opts:["Rate","Volume","Both"], a:0},{q:"Fix first?", opts:["Top","Bottleneck","Bottom"], a:1}] },
  ]},
  { id:5, title:"Industries", desc:"SaaS, Retail, Healthcare, Energy — supply shift gasoline case", xp:70, lessons:[
    { t:"Tech SaaS — Churn & LTV", c:"MRR, Churn, LTV=CAC×3 rule.", ex:"Churn 5%→ LTV=ARPU/Churn= $100/0.05=$2000", try:"SaaS churn 9% impact?", approach:"LTV halves vs 5%. Need lower CAC or better retention.", exp:"SaaS health = net retention >100%", quiz:[{q:"LTV formula?", opts:["ARPU×Churn","ARPU/Churn","CAC/Churn"], a:1},{q:"Net retention >100% means?", opts:["Shrinking","Expanding","Flat"], a:1}] },
    { t:"Retail Footfall", c:"Sales=Footfall×Conversion×Basket.", ex:"Mall down 30% footfall → sales down even if conv up", try:"Coffee chain footfall -15%", approach:"Remote work = less footfall. Fix with app orders.", exp:"Retail is location + conversion.", quiz:[{q:"Sales = ?", opts:["Price×Vol","Footfall×Conv×Basket","Rev-Cost"], a:1},{q:"Fix footfall?", opts:["Lower price","Omnichannel","More staff"], a:1}] },
    { t:"Energy — Refinery Supply Shift", c:"Gasoline case: refinery outage = supply left → price up.", ex:"US gas 370M gal/day, refinery 5% out = 18M short → price spike", try:"Why gas price up after fire?", approach:"Supply curve left, demand inelastic short-term → price up sharply", exp:"Energy: supply shocks dominate, demand inelastic.", quiz:[{q:"Supply ↓ price?", opts:["↓","↑","Same"], a:1},{q:"Demand for gas short-term?", opts:["Elastic","Inelastic","Unit"], a:1}] },
  ]},
  { id:6, title:"Advanced Estimation", desc:"Compounding, Rule72, Weighted, Market maps", xp:60, lessons:[
    { t:"Rule72 & Compounding", c:"Double 72/r, CAGR = (End/Start)^(1/n)-1", ex:"20% 3y: 1.2^3=1.73x", try:"Double at 6%?", approach:"72/6=12y", exp:"Rule72 fast in interviews.", quiz:[{q:"Triple at 12%?", opts:["9.5y","6y","12y"], a:0},{q:"1.2^3?", opts:["1.44","1.73","2.0"], a:1}] },
    { t:"Weighted Averages", c:"Mix rates correctly.", ex:"70% $5 +30% $8 = $5.9", try:"Mix 40% 12 +60% 18", approach:"4.8+10.8=15.6", exp:"Weighted = Σw×v, weights sum 1.", quiz:[{q:"Weighted 80% 90 20%70", opts:["80","86","90"], a:1},{q:"Weights must sum?", opts:["0","1","100%"], a:2}] },
  ]},
  { id:7, title:"PEI & Fit", desc:"McK 6 qualities, BCG pressure, Bain authenticity, Story bank", xp:50, lessons:[
    { t:"McKinsey 6 Qualities", c:"Leadership, Drive, Resilience, Impact, Entrepreneurship, Inclusive", ex:"Story: led 4 under 2-week deadline, increased clarity 30%", try:"Draft leadership story", approach:"Situation-Task-Action-Result + what you learned + what you'd do diff", exp:"Mile-deep: why you? hard? diff next?", quiz:[{q:"McK PEI depth?", opts:["1 story","Mile-deep follow-ups","Star"], a:1},{q:"Inclusive means?", opts:["Led alone","Brought diverse views","Ignored"], a:1}] },
    { t:"BCG Pressure Test", c:"What was hardest? Conflict?", ex:"Push: why didn't you quit?", try:"Add conflict to story", approach:"Conflict with engineer → listened + data → aligned", exp:"BCG tests resilience under pressure.", quiz:[{q:"BCG likes?", opts:["Smooth","Pressure handling","Solo"], a:1},{q:"Conflict example good?", opts:["Avoided","Resolved with data","Escalated"], a:1}] },
  ]},
  { id:8, title:"Mocks & Firm Specific", desc:"McK interviewer-led, BCG Casey, Bain, Boutique checklist", xp:60, lessons:[
    { t:"McKinsey Interviewer-Led", c:"They drive, 7 min PEI + 25 min case, hypothesis first", ex:"Start: 'We have hypothesis profit down due to pricing...'", try:"Practice interviewer-led start", approach:"Structure quickly, ask for data to test hyp, 80/20", exp:"McK: don't ask to take time — go.", quiz:[{q:"McK case style?", opts:["Candidate-led","Interviewer-led","Both"], a:1},{q:"Time?", opts:["45min","25min","60min"], a:1}] },
    { t:"BCG Casey — Creativity", c:"Open, brainstorm, no structure given, test creativity", ex:"'How to increase adoption of EVs?' — no framework, go broad then prioritize", try:"Brainstorm 5 ways to price NYC parking", approach:"Residential permit, dynamic, auction, etc — then evaluate", exp:"BCG rewards creativity + structure after.", quiz:[{q:"BCG gives structure?", opts:["Yes","No","Sometimes"], a:1},{q:"First step Casey?", opts:["Framework","Brainstorm","Math"], a:1}] },
    { t:"Boutique Checklist", c:"Fit + market sizing + quick math + case", ex:"45 min all-in, test mental math heavily", try:"Checklist your prep", approach:"PEI 5 min, sizing 10, case 25, Q&A 5", exp:"Boutiques less formal but math heavy.", quiz:[{q:"Boutique focus?", opts:["PEI","Math","Both"], a:2},{q:"Prep?", opts:["Only cases","Cases+math+PEI","Only math"], a:1}] },
  ]},
];

type MathQ = { id:number; cat:string; q:string; interview:string; ans:number; trick:string; steps:string[]; opts?:number[] };
const CATS = ["All","% & Fractions","Reverse %","Growth/CAGR","BE FC/(P-VC)","Weighted Avg","Big Mult/Div","Market Sizing Math","Rule72"];

const MATH_BANK: MathQ[] = [
  { id:1, cat:"% & Fractions", q:"18% of 2,500", interview:"Interviewer: You mention 18% churn. 2,500 subs — how many churned? Walk me through", ans:450, trick:"18% = 20% -2% → 500-50=450", steps:["20% of 2500=500","2% =50","500-50=450"] },
  { id:2, cat:"Reverse %", q:"360 is 45% of ?", interview:"If 360 customers are 45% who converted, what's total top of funnel?", ans:800, trick:"45%≈50%-5% → 360/0.45 = 800", steps:["10% =80","45% = 360","100% = 800"] },
  { id:3, cat:"% & Fractions", q:"15% up from 80", interview:"80 stores last year, up 15% — now?", ans:92, trick:"10% +5% =8+4=12", steps:["10% of80=8","5% =4","80+12=92"] },
  { id:4, cat:"Growth/CAGR", q:"CAGR: 100 → 20% ×3y", interview:"100M revenue growing 20% YoY 3 years — final?", ans:173, trick:"1.2³=1.728", steps:["Y1 120","Y2 144","Y3 172.8≈173"] },
  { id:5, cat:"BE FC/(P-VC)", q:"BE: FC120k P15 VC7", interview:"Fixed 120k, price 15, var 7 — breakeven units?", ans:15000, trick:"8 contribution", steps:["Contrib=15-7=8","120k/8=15k"] },
  { id:6, cat:"Weighted Avg", q:"70%×200 $5 +30% $8 avg?", interview:"70% buy $5, 30% $8 — weighted ARPU?", ans:5.9, trick:"0.7*5=3.5, 0.3*8=2.4", steps:["3.5+2.4=5.9"] },
  { id:7, cat:"Rule72", q:"Double at 8%?", interview:"How long to double at 8% growth?", ans:9, trick:"72/8=9", steps:["Rule72: 72/rate"] },
  { id:8, cat:"Market Sizing Math", q:"3.52M×0.45×1.33", interview:"We have 3.52M HH, 45% own, 1.33 cars each — total cars?", ans:2.11, trick:"3.52×0.45≈1.58×1.33≈2.11", steps:["3.52×0.45=1.584","×1.33=2.11M"] },
  { id:9, cat:"% & Fractions", q:"12.5% of 640", interview:"12.5% defect rate, 640 units — how many defects?", ans:80, trick:"12.5%=1/8", steps:["640/8=80"] },
  { id:10, cat:"% & Fractions", q:"7.5% of 1,200", interview:"7.5% commission on $1,200 sale?", ans:90, trick:"10% -2.5% =120-30", steps:["10%=120","2.5%=30","90"] },
  { id:11, cat:"Big Mult/Div", q:"2,500×1.33", interview:"2,500 HH ×1.33 cars — quick?", ans:3325, trick:"1/3 extra", steps:["2500 + 2500/3≈833","=3333≈3325 exact"] },
  { id:12, cat:"% & Fractions", q:"22% of 800", interview:"22% market share, 800M market — revenue?", ans:176, trick:"20%+2% =160+16", steps:["160+16=176"] },
  { id:13, cat:"Reverse %", q:"After 20% off, $96 — original?", interview:"Price after 20% discount is $96 — original?", ans:120, trick:"0.8x=96", steps:["96/0.8=120"] },
  { id:14, cat:"Growth/CAGR", q:"Double 3y → CAGR?", interview:"Revenue doubled in 3y — CAGR?", ans:26, trick:"Cube root 2≈1.26", steps:["2^(1/3)≈1.26 →26%"] },
  { id:15, cat:"BE FC/(P-VC)", q:"BE $: FC50k margin 25%", interview:"Fixed 50k, 25% margin — breakeven sales $?", ans:200000, trick:"50k/0.25", steps:["200k"] },
  { id:16, cat:"Weighted Avg", q:"Mix: 40% 12 +60% 18", interview:"40% score 12, 60% 18 — avg?", ans:15.6, trick:"12+0.6*6", steps:["4.8+10.8=15.6"] },
  { id:17, cat:"% & Fractions", q:"37.5% of 400", interview:"37.5% = 3/8 of 400?", ans:150, trick:"3/8", steps:["400/8=50×3=150"] },
  { id:18, cat:"Rule72", q:"Triple at 12%?", interview:"Time to triple at 12%?", ans:9.5, trick:"114/12≈9.5 triple", steps:["114 rule for triple"] },
  { id:19, cat:"Market Sizing Math", q:"8.8M/2.5", interview:"8.8M people, 2.5 per HH — HH count?", ans:3.52, trick:"88/25=3.52", steps:["8.8/2.5=3.52M"] },
  { id:20, cat:"Big Mult/Div", q:"1.58M×400", interview:"1.58M cars × $400 fee — revenue?", ans:632, trick:"1.58×4=6.32 →632M", steps:["632M"] },
  { id:21, cat:"% & Fractions", q:"62.5% of 800", interview:"62.5% =5/8 of 800", ans:500, trick:"5/8", steps:["100×5=500"] },
];

function SankeyDiagram({ blurred=false, highlight=false }: { blurred?: boolean; highlight?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border bg-white ${highlight ? "border-black" : "border-[#e8e6e1]"} p-3`}>
      <div className="flex items-center justify-between gap-2">
        {[
          { k:"Pop", v:"8.8M", w:90 },
          { k:"HH", v:"3.52M", w:80 },
          { k:"Own", v:"1.58M", w:70 },
          { k:"Cars", v:"2.11M", w:90 },
        ].map((s,i)=>(
          <React.Fragment key={s.k}>
            <div className={`rounded-lg px-2 py-2 text-center ${highlight && i===3 ? "bg-black text-white" : "bg-[#f6f5f3]"} transition-all`} style={{ minWidth:s.w }}>
              <div className="text-[10px] uppercase tracking-wide opacity-60">{s.k}</div>
              <div className="text-sm font-semibold">{blurred ? "• • •" : s.v}</div>
            </div>
            {i<3 && <div className={`h-[3px] flex-1 ${highlight ? "bg-black" : "bg-[#e8e6e1]"} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent animate-[shimmer_1.8s_infinite]" />
            </div>}
          </React.Fragment>
        ))}
      </div>
      <svg className="mt-3 w-full h-[36px]" viewBox="0 0 400 36">
        <path d="M10 18 Q100 2 200 18 T390 18" stroke={highlight?"#111":"#e8e6e1"} strokeWidth={highlight?3:2} fill="none" strokeDasharray={blurred?"6 6":"0"} />
      </svg>
    </div>
  );
}

function MiniTree({ type }:{type:string}){
  const map:any = {
    mece: ["A","B","C"], pyramid: ["Ans","Why1","Why2"], tree: ["Issue","Sub1","Sub2"], profit: ["Profit","Rev","Cost"],
  };
  const n = map[type]||["A","B","C"];
  return (
    <svg viewBox="0 0 120 50" className="w-[110px] h-[44px]">
      <rect x="35" y="2" width="50" height="14" rx="6" fill="#111"/><text x="60" y="11" textAnchor="middle" fill="white" fontSize="7" fontWeight="600">{n[0]}</text>
      <line x1="60" y1="16" x2="25" y2="30" stroke="#e8e6e1"/><line x1="60" y1="16" x2="95" y2="30" stroke="#e8e6e1"/>
      <rect x="5" y="30" width="40" height="12" rx="5" fill="#f6f5f3" stroke="#e8e6e1"/><rect x="75" y="30" width="40" height="12" rx="5" fill="#f6f5f3" stroke="#e8e6e1"/>
      <text x="25" y="38" textAnchor="middle" fontSize="6">{n[1]}</text><text x="95" y="38" textAnchor="middle" fontSize="6">{n[2]}</text>
    </svg>
  );
}

function ProfitTreeSVG() {
  return (
    <svg viewBox="0 0 260 120" className="w-full h-[110px]">
      <rect x="90" y="6" width="80" height="22" rx="8" fill="#111" />
      <text x="130" y="20" textAnchor="middle" fill="white" fontSize="10" fontWeight="600">Profit</text>
      <line x1="130" y1="28" x2="60" y2="50" stroke="#e8e6e1" strokeWidth="1.5" />
      <line x1="130" y1="28" x2="200" y2="50" stroke="#e8e6e1" strokeWidth="1.5" />
      <rect x="20" y="50" width="80" height="20" rx="8" fill="#f6f5f3" stroke="#e8e6e1" />
      <rect x="160" y="50" width="80" height="20" rx="8" fill="#f6f5f3" stroke="#e8e6e1" />
      <text x="60" y="62" textAnchor="middle" fontSize="9">Revenue</text>
      <text x="200" y="62" textAnchor="middle" fontSize="9">Cost</text>
      <line x1="60" y1="70" x2="30" y2="92" stroke="#e8e6e1" />
      <line x1="60" y1="70" x2="90" y2="92" stroke="#e8e6e1" />
      <rect x="10" y="92" width="40" height="18" rx="6" fill="white" stroke="#e8e6e1" /><text x="30" y="104" textAnchor="middle" fontSize="8">Price</text>
      <rect x="70" y="92" width="40" height="18" rx="6" fill="white" stroke="#e8e6e1" /><text x="90" y="104" textAnchor="middle" fontSize="8">Vol</text>
    </svg>
  );
}

export default function App() {
  // --- App state ---
  const [activeTab, setActiveTab] = useState<"dashboard"|"plan"|"concepts"|"challenges"|"modules"|"math"|"pei"|"mocks">("dashboard");
  const [currentDay, setCurrentDay] = useState(3);
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set([1,2]));
  const [thought, setThought] = useState("");
  const [caseStage, setCaseStage] = useState<1|2|3|4>(1);
  const [blurRevealed, setBlurRevealed] = useState(false);
  const [showApproach, setShowApproach] = useState(false);
  const [usedHints, setUsedHints] = useState<number[]>([]);
  const [hintTokens, setHintTokens] = useState(3);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selfRating, setSelfRating] = useState<string|null>(null);
  const [mcqPick, setMcqPick] = useState<number|null>(null);
  const [timerSec, setTimerSec] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number|undefined>(undefined);

  // Math trainer
  const [mathMode, setMathMode] = useState<"learn"|"sprint"|"weakness">("learn");
  const [mathCat, setMathCat] = useState("All");
  const [mathDiff, setMathDiff] = useState<"interview"|"mbb"|"god">("interview");
  const [mathQCount, setMathQCount] = useState<5|10|20>(5);
  const [mathIdx, setMathIdx] = useState(0);
  const [mathInput, setMathInput] = useState("");
  const [mathHistory, setMathHistory] = useState<{id:number; cat:string; time:number; correct:boolean}[]>([
    { id:1, cat:"% & Fractions", time:18, correct:true },
    { id:2, cat:"Reverse %", time:14, correct:false },
    { id:8, cat:"Market Sizing Math", time:22, correct:true },
  ]);
  const [mathFeedback, setMathFeedback] = useState<null|{correct:boolean; time:number; trick:string; steps:string[]}>(null);
  const [sprintLeft, setSprintLeft] = useState(120);
  const sprintRef = useRef<number|undefined>(undefined);
  const [showFormula, setShowFormula] = useState(false);
  const [weakOnly, setWeakOnly] = useState(false);
  const [dailyDone, setDailyDone] = useState(3);

  // PEI + Mocks
  const [pei, setPei] = useState({ lead:"Led team of 4 to ship pricing model under 2-week deadline...", impact:"Built new curb pricing framework, increased revenue clarity 30%...", drive:"Obsessed with unit hygiene after failing first market sizing..." });
  const [mockSec, setMockSec] = useState(0);
  const mockRef = useRef<number|undefined>(undefined);
  const [mockRunning, setMockRunning] = useState(false);

  // NEW: XP + Concepts + Challenges + Modules (in-memory, no localStorage)
  const [xp, setXp] = useState(140);
  const [conceptsSearch, setConceptsSearch] = useState("");
  const [expandedConcept, setExpandedConcept] = useState<string|null>(null);
  const [conceptsViewed, setConceptsViewed] = useState<Set<string>>(new Set(["mece","profit"]));
  const [challengeHistory, setChallengeHistory] = useState<{id:number; bestTime:number; completed:boolean}[]>([{id:1,bestTime:42,completed:true},{id:12,bestTime:78,completed:true}]);
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [chThink, setChThink] = useState(""); const [chStage, setChStage] = useState<1|2|3|4>(1); const [chBlur, setChBlur] = useState(false);
  const [modulesProgress, setModulesProgress] = useState<Record<number, Set<number>>>({1:new Set([0]),2:new Set([])});
  const [activeModule, setActiveModule] = useState<number|null>(null);
  const [activeLesson, setActiveLesson] = useState<number>(0);
  const [lessonThink, setLessonThink] = useState(""); const [lessonStage, setLessonStage] = useState<1|2|3|4>(1); const [lessonQuizPick, setLessonQuizPick] = useState<(number|null)[]>([null,null]);
  const [exportMsg, setExportMsg] = useState("");
  const [navFlash, setNavFlash] = useState<string>("");

  const targetTime = mathDiff==="interview"?12: mathDiff==="mbb"?8:5;

  // timers with cleanup — fix leak
  useEffect(()=>{
    if(paused || caseStage===4) return;
    timerRef.current = window.setInterval(()=> setTimerSec(s=>s+1),1000);
    return ()=> { if(timerRef.current) clearInterval(timerRef.current); };
  },[paused, caseStage]);

  useEffect(()=>{
    if(mathMode!=="sprint" || mathFeedback) return;
    if(sprintLeft<=0) return;
    sprintRef.current = window.setInterval(()=> setSprintLeft(s=>Math.max(0,s-1)),1000);
    return ()=> { if(sprintRef.current) clearInterval(sprintRef.current); };
  },[mathMode, sprintLeft, mathFeedback]);

  useEffect(()=>{
    if(!mockRunning) return;
    mockRef.current = window.setInterval(()=> setMockSec(s=>s+1),1000);
    return ()=> { if(mockRef.current) clearInterval(mockRef.current); };
  },[mockRunning]);

  const filteredMath = useMemo(()=>{
    let list = MATH_BANK;
    if(mathCat!=="All") list = list.filter(q=>q.cat===mathCat);
    if(weakOnly){
      const weakCats = Object.entries(
        mathHistory.reduce((acc:any, h)=>{acc[h.cat]=acc[h.cat]||[]; acc[h.cat].push(h.time); return acc;},{})
      ).map(([cat, times]:any)=>({cat, avg: times.reduce((a:number,b:number)=>a+b,0)/times.length}))
      .sort((a:any,b:any)=>b.avg-a.avg).slice(0,2).map((x:any)=>x.cat);
      if(weakCats.length) list = list.filter(q=>weakCats.includes(q.cat));
    }
    if(mathMode==="weakness"){
      const slow = [...mathHistory].sort((a,b)=>b.time-a.time)[0];
      if(slow) list = list.filter(q=>q.cat===slow.cat);
    }
    return list.slice(0,50);
  },[mathCat, weakOnly, mathMode, mathHistory]);

  const activeMathQs = useMemo(()=> filteredMath.slice(0, mathQCount), [filteredMath, mathQCount]);
  const currentMath = activeMathQs[mathIdx];

  const weaknessCat = useMemo(()=>{
    if(!mathHistory.length) return null;
    const map: any = {};
    mathHistory.forEach(h=>{ map[h.cat]=map[h.cat]||{t:[],c:0}; map[h.cat].t.push(h.time); if(!h.correct) map[h.cat].c++; });
    const entries = Object.entries(map).map(([cat,v]:any)=>({cat, avg: v.t.reduce((a:number,b:number)=>a+b,0)/v.t.length, wrong:v.c}));
    return entries.sort((a,b)=>b.avg-a.avg)[0];
  },[mathHistory]);

  const filteredConcepts = useMemo(()=> CONCEPTS_DATA.filter(c=> !conceptsSearch || (c.name+c.when+c.struct).toLowerCase().includes(conceptsSearch.toLowerCase())),[conceptsSearch]);
  const level = Math.floor(xp/100)+1; const xpNext = level*100; const xpPct = Math.round((xp % 100));

  const progressPct = Math.round((completedDays.size/80)*100);
  const canUnlockThink = thought.trim().length>=15;

  const handleCheckThinking = ()=>{
    if(!canUnlockThink) return;
    setShowApproach(true);
    setCaseStage(2);
  };

  const handleUseHint = (tier:number, cost:number)=>{
    if(cost>0 && hintTokens<=0) return;
    if(usedHints.includes(tier)) return;
    if(cost>0) setHintTokens(t=>t-1);
    setUsedHints(h=>[...h,tier]);
    setCaseStage(3);
  };

  const handleRevealAns = ()=>{
    setShowExplanation(true);
    setCaseStage(4);
  };

  const handleSelfRate = (r:string)=>{
    setSelfRating(r);
    setCompletedDays(s=>{ const ns=new Set(s); ns.add(currentDay); return ns; });
    if(currentDay<80) setCurrentDay(d=>d+1);
    setXp(x=>x+20);
  };

  const handleMathSubmit = ()=>{
    if(!currentMath) return;
    const val = parseFloat(mathInput);
    const correct = Math.abs(val - currentMath.ans) < 0.15 * Math.max(1,Math.abs(currentMath.ans)) + 0.01 || val===currentMath.ans;
    const timeTaken = mathMode==="learn" ? Math.floor(Math.random()*6+4) : mathMode==="sprint" ? targetTime + (correct? -1:2) : targetTime+2;
    const fb = { correct, time: timeTaken, trick: currentMath.trick, steps: currentMath.steps };
    setMathFeedback(fb);
    setMathHistory(h=>[...h, { id:currentMath.id, cat:currentMath.cat, time:timeTaken, correct }]);
    setDailyDone(d=>Math.min(20,d+1));
    if(correct) setXp(x=>x+2);
  };

  const nextMath = ()=>{
    setMathFeedback(null);
    setMathInput("");
    if(mathIdx < activeMathQs.length-1) setMathIdx(i=>i+1);
    else { setMathIdx(0); }
  };

  const exportJSON = ()=>{
    const data = { currentDay, completedDays: Array.from(completedDays), thought, hintTokens, mathHistory, dailyDone, xp, conceptsViewed: Array.from(conceptsViewed), challengeHistory, modulesProgress: Object.fromEntries(Object.entries(modulesProgress).map(([k,v]:any)=>[k,Array.from(v)])) };
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download="crackit-final.json"; a.click(); URL.revokeObjectURL(url);
    setExportMsg("Export ready ✓");
    setTimeout(()=>setExportMsg(""), 2500);
  };

  const resetAll = ()=>{
    setCurrentDay(3); setCompletedDays(new Set([1,2])); setThought(""); setCaseStage(1); setBlurRevealed(false); setShowApproach(false); setUsedHints([]); setHintTokens(3); setShowExplanation(false); setSelfRating(null); setMcqPick(null); setTimerSec(0); setMathHistory([]); setDailyDone(3); setMathIdx(0); setXp(140); setConceptsViewed(new Set(["mece","profit"])); setChallengeHistory([{id:1,bestTime:42,completed:true},{id:12,bestTime:78,completed:true}]); setModulesProgress({1:new Set([0])}); setActiveChallenge(null); setActiveModule(null);
    setExportMsg("Reset done");
    setTimeout(()=>setExportMsg(""), 1500);
  };

  // week gating
  const weeks = Array.from({length:16}, (_,wi)=>{
    const start = wi*5+1;
    return { week:wi+1, days: Array.from({length:5}, (_,di)=> start+di), hours: 4+ (wi%3) };
  });

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: BG, fontFamily:"Inter, ui-sans-serif, system-ui" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}} ::-webkit-scrollbar{display:none}`}</style>

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b overflow-hidden" style={{ borderColor:CARD_BORDER }}>
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black text-white grid place-items-center font-black text-[11px]">CI</div>
            <div className="font-extrabold tracking-[0.12em] text-[12px] hidden sm:block">CRACK-IT ACADEMY • FINAL</div>
            <div className="font-extrabold tracking-[0.12em] text-[12px] sm:hidden">CRACK-IT</div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-2 px-2.5 h-7 rounded-full bg-[#f6f5f3] border text-[11px] font-semibold" style={{ borderColor:CARD_BORDER }}><Star size={12}/> Lvl {level} • {xp} XP</div>
            <div className="hidden md:flex items-center gap-2 px-3 h-8 rounded-full bg-black text-white text-xs font-semibold"><Flame size={14}/> Streak {completedDays.size} 🔥</div>
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8">
                <svg viewBox="0 0 36 36" className="w-8 h-8 rotate-[-90deg]"><circle cx="18" cy="18" r="15" fill="none" stroke="#eee" strokeWidth="3"/><circle cx="18" cy="18" r="15" fill="none" stroke="#111" strokeWidth="3" strokeDasharray={`${progressPct*0.94} 100`} strokeLinecap="round"/></svg>
                <span className="absolute inset-0 grid place-items-center text-[10px] font-bold">{progressPct}%</span>
              </div>
              <span className="text-xs font-medium">Day {currentDay}/80</span>
            </div>
            <button onClick={exportJSON} className="h-8 px-3 rounded-full border text-xs font-medium hover:bg-black hover:text-white transition flex items-center gap-1" style={{ borderColor:CARD_BORDER }}><span className="hidden md:inline">{exportMsg || "Export"}</span><span className="md:hidden"><Download size={14}/></span></button>
            <button onClick={resetAll} className="h-8 w-8 md:w-auto md:px-3 rounded-full bg-[#f6f5f3] border text-xs font-medium grid place-items-center" style={{ borderColor:CARD_BORDER }}><span className="hidden md:inline">Reset</span><span className="md:hidden"><RotateCcw size={14}/></span></button>
          </div>
        </div>
        {exportMsg && <div className="bg-black text-white text-[11px] text-center py-1">{exportMsg} — file downloaded</div>}
        {navFlash && <div className="bg-[#f6f5f3] text-[11px] text-center py-0.5 border-b" style={{ borderColor:CARD_BORDER }}>{navFlash}</div>}
      </header>

      <div className="max-w-[1440px] mx-auto px-3 md:px-6 py-4 md:py-6 flex gap-4 md:gap-6 overflow-hidden">
        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-[88px] h-fit rounded-[20px] p-3 space-y-3" style={{ background:"#f6f5f3", border:`1px solid ${CARD_BORDER}` }}>
          <div className="rounded-[14px] bg-white border p-3" style={{ borderColor:CARD_BORDER }}>
            <div className="flex items-center justify-between text-[11px] font-semibold"><span className="flex items-center gap-1"><Star size={12}/> Level {level}</span><span className="opacity-60">{xp} / {xpNext} XP</span></div>
            <div className="mt-2 h-1.5 rounded-full bg-[#f6f5f3] overflow-hidden"><div className="h-full bg-black" style={{ width:`${xpPct}%` }} /></div>
            <div className="mt-1 text-[10px] opacity-60">{100-xpPct} XP to Lvl {level+1}</div>
          </div>
          <nav className="space-y-1">
            {[
              { id:"dashboard", label:"Dashboard", icon:BarChart3 },
              { id:"plan", label:"80-Day Plan", icon:Target },
              { id:"concepts", label:"Concepts & Frameworks", icon:Brain },
              { id:"challenges", label:"Challenges", icon:Swords },
              { id:"modules", label:"Learning Modules", icon:BookOpen },
              { id:"math", label:"Math Trainer", icon:Zap },
              { id:"pei", label:"PEI Builder", icon:Trophy },
              { id:"mocks", label:"Mocks", icon:Clock },
            ].map(n=>{
              const active = activeTab===n.id;
              return <button key={n.id} onClick={()=>{setActiveTab(n.id as any); setNavFlash(`Opened ${n.label}`); setTimeout(()=>setNavFlash(""),1200);}} className={`w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] font-medium transition ${active?"bg-black text-white":"hover:bg-white"}`}><n.icon size={16}/>{n.label}{n.id==="challenges"&&<span className="ml-auto text-[10px] bg-black text-white px-1.5 py-0.5 rounded-full">🔥</span>}</button>;
            })}
          </nav>
          <div className="mt-4 space-y-3">
            <div className="rounded-[16px] bg-white p-3 border" style={{ borderColor:CARD_BORDER }}>
              <div className="text-[10px] uppercase tracking-wide opacity-60 font-semibold">Daily Focus</div>
              <div className="mt-1 text-xs font-medium leading-snug">Day {currentDay}: {CASE_DATA.title.split("—")[0]}</div>
              <div className="mt-2 flex items-center gap-2 text-[11px]"><Clock size={12}/>{Math.floor(timerSec/60)}m {timerSec%60}s <button onClick={()=>setPaused(p=>!p)} className="ml-auto w-6 h-6 rounded-full bg-black text-white grid place-items-center">{paused?<Play size={10}/>:<Pause size={10}/>}</button></div>
            </div>
            <div className="rounded-[16px] bg-white p-3 border" style={{ borderColor:CARD_BORDER }}>
              <div className="text-[10px] uppercase tracking-wide opacity-60 font-semibold">Weakness</div>
              <div className="mt-1 text-xs">{weaknessCat ? `${weaknessCat.cat} ${weaknessCat.avg.toFixed(1)}s vs ${targetTime}s` : "Solve 3 Qs to detect"}</div>
              {weaknessCat && <div className="mt-2 h-1.5 rounded-full bg-[#f6f5f3] overflow-hidden"><div className="h-full bg-black" style={{ width: `${Math.min(100, (weaknessCat.avg/targetTime)*50)}%` }} /></div>}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 max-w-3xl mx-auto lg:mx-0 overflow-hidden">
          {activeTab==="dashboard" && (
            <div className="space-y-5">
              {/* XP + Next Challenge */}
              <div className="grid md:grid-cols-[1.4fr_1fr] gap-3">
                <div className="rounded-[20px] bg-black text-white p-5 flex items-center justify-between">
                  <div><div className="text-[11px] uppercase tracking-wide opacity-60 font-semibold">Level {level} • {xp} XP</div><div className="mt-1 text-[16px] font-bold">Keep shipping — {100-xpPct} XP to next level</div><div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden w-[200px]"><div className="h-full bg-white" style={{ width:`${xpPct}%` }}/></div></div>
                  <div className="w-10 h-10 rounded-full bg-white text-black grid place-items-center"><Award size={20}/></div>
                </div>
                <div className="rounded-[20px] bg-white border p-4 flex items-center justify-between" style={{ borderColor:CARD_BORDER }}>
                  <div><div className="text-[11px] uppercase tracking-wide font-semibold opacity-60 flex items-center gap-1"><Swords size={12}/> Next Challenge 🔥</div><div className="mt-1 text-[13px] font-semibold">Daily Micro — Ubers in NYC</div><div className="mt-1 text-[11px] opacity-60">5 min • +20 XP</div></div>
                  <button onClick={()=>{setActiveTab("challenges"); setActiveChallenge(CHALLENGES_DATA[0]); setChThink(""); setChStage(1);}} className="h-8 px-3 rounded-full bg-black text-white text-xs font-semibold">Play →</button>
                </div>
              </div>
              {thought && <div className="rounded-[16px] bg-black text-white px-4 py-3 text-xs flex items-center justify-between"><span>Continue Day {currentDay} where you left off</span><button onClick={()=>setActiveTab("plan")} className="px-2 py-1 rounded-full bg-white text-black text-[11px] font-semibold">Resume</button></div>}

              {/* Today's Focus Card */}
              <div className="rounded-[20px] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] border p-5 md:p-6" style={{ borderColor:CARD_BORDER }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#f6f5f3] text-[10px] font-semibold tracking-wide uppercase">{CASE_DATA.client} • Day {currentDay}</div>
                    <h1 className="mt-3 text-[18px] md:text-[22px] font-bold leading-tight">{CASE_DATA.title}</h1>
                    <p className="mt-2 text-[13px] leading-[1.5] text-[#444]"><span className="font-semibold text-black">Situation:</span> {CASE_DATA.situation}</p>
                    <p className="mt-1 text-[13px]"><span className="font-semibold">What I'm checking:</span> {CASE_DATA.checking}</p>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-[11px]"><Clock size={14}/>{Math.floor(timerSec/60)}:{String(timerSec%60).padStart(2,"0")}</div>
                </div>

                {/* Stage 0 blur block — ONLY place numbers live */}
                <div className="mt-5 relative rounded-[16px] border bg-[#fbfaf8] overflow-hidden" style={{ borderColor:CARD_BORDER }}>
                  <div className="absolute top-3 right-3 z-10">
                    <button onClick={()=>setBlurRevealed(v=>!v)} className="w-9 h-9 rounded-full bg-white border shadow grid place-items-center" style={{ borderColor:CARD_BORDER }}>{blurRevealed?<EyeOff size={16}/>:<Eye size={16}/>}</button>
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] uppercase tracking-wide font-semibold opacity-60">Interviewer Data • Diagram — blurred until eye click</div>
                    <div className={`mt-3 grid md:grid-cols-[1.2fr_1.8fr] gap-3 transition-all duration-300 ${blurRevealed?"":"blur-[16px] opacity-[0.35] select-none pointer-events-none"}`}>
                      <div className="rounded-xl bg-white border p-3 space-y-2" style={{ borderColor:CARD_BORDER }}>
                        <div className="text-xs font-semibold">Data Pack</div>
                        <div className="text-[12px] space-y-1 leading-snug">
                          <div>👥 {CASE_DATA.interviewerData.pop}</div>
                          <div>🏠 {CASE_DATA.interviewerData.hhSize}</div>
                          <div>🚗 {CASE_DATA.interviewerData.ownRate}</div>
                          <div>🔢 {CASE_DATA.interviewerData.carsPer}</div>
                        </div>
                        <ProfitTreeSVG/>
                      </div>
                      <SankeyDiagram blurred={!blurRevealed} />
                    </div>
                    {!blurRevealed && <div className="mt-2 text-[11px] opacity-60 flex items-center gap-1"><Eye size={12}/> Click eye to reveal numbers — they live ONLY here</div>}
                  </div>
                </div>

                {/* Stage 1 Think */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 text-[12px] font-semibold"><div className="w-6 h-6 rounded-full bg-black text-white grid place-items-center text-[11px]">1</div> Think (dwell-first mandatory)</div>
                  <textarea value={thought} onChange={e=>setThought(e.target.value)} placeholder="Your thinking — how would you approach this?" className="mt-3 w-full min-h-[96px] rounded-[14px] border bg-[#fbfaf8] p-3 text-[13px] outline-none focus:border-black" style={{ borderColor:CARD_BORDER }} />
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[11px] ${thought.length>=15?"text-green-600":"opacity-60"}`}>{thought.length}/15 min chars to unlock</span>
                    <button disabled={!canUnlockThink} onClick={handleCheckThinking} className={`h-9 px-4 rounded-full text-xs font-semibold transition ${canUnlockThink?"bg-black text-white":"bg-[#eee] text-[#999]"}`}>Check my thinking →</button>
                  </div>
                </div>

                {/* Stage 2 Approach */}
                {showApproach && (
                  <div className="mt-6 rounded-[16px] border bg-[#f6f5f3] p-4" style={{ borderColor:CARD_BORDER }}>
                    <div className="flex items-center gap-2 text-[12px] font-semibold"><div className="w-6 h-6 rounded-full bg-white border grid place-items-center">2</div> Approach (not answer) — no numbers</div>
                    <p className="mt-2 text-[13px] leading-relaxed">{CASE_DATA.approach}</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={()=>setCaseStage(3)} className="h-8 px-3 rounded-full bg-black text-white text-xs font-semibold">Continue to Hints</button>
                      <button onClick={handleRevealAns} className="h-8 px-3 rounded-full border bg-white text-xs">Skip to explanation</button>
                    </div>
                  </div>
                )}

                {/* Stage 3 Hints tiered */}
                {caseStage>=3 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2 text-[12px] font-semibold"><div className="w-6 h-6 rounded-full bg-black text-white grid place-items-center">3</div> Hints tiered — tokens: {hintTokens} • Gold star if Tier1 only</div>
                    {CASE_DATA.hints.map(h=>{
                      const used = usedHints.includes(h.tier);
                      const canAfford = h.cost===0 || hintTokens>0 || used;
                      return (
                        <div key={h.tier} className="rounded-[14px] border bg-white p-3 flex items-start justify-between gap-3" style={{ borderColor:CARD_BORDER }}>
                          <div>
                            <div className="text-[10px] uppercase tracking-wide font-semibold opacity-60">{h.label}</div>
                            <div className={`mt-1 text-[13px] ${used?"":"blur-[6px] select-none"}`}>{h.text}</div>
                            {used && h.tier===2 && <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 inline-flex items-center gap-1"><AlertTriangle size={12}/> Trap: unit error — people vs households</div>}
                          </div>
                          <button disabled={used || !canAfford} onClick={()=>handleUseHint(h.tier,h.cost)} className={`shrink-0 h-8 px-3 rounded-full text-xs font-semibold border ${used?"bg-green-50 border-green-200 text-green-700":"bg-black text-white"}`}>{used?"Revealed": h.cost?`Use -${h.cost} token`:"Reveal free"}</button>
                        </div>
                      );
                    })}
                    <button onClick={handleRevealAns} className="w-full h-10 rounded-full bg-black text-white text-sm font-semibold">Show full explanation</button>
                  </div>
                )}

                {/* Stage 4 Reveal Answer */}
                {showExplanation && (
                  <div className="mt-6 rounded-[20px] border-2 border-black p-4 md:p-5 bg-white">
                    <div className="flex items-center gap-2 text-[13px] font-bold"><Trophy size={16}/> Final Answer + Explanation</div>
                    <div className="mt-3 rounded-xl bg-[#fbfaf8] border p-3" style={{ borderColor:CARD_BORDER }}>
                      <div className="text-xs font-semibold">Math</div>
                      <div className="mt-1 font-mono text-[13px]">{CASE_DATA.solution.math}</div>
                      <div className="mt-2 flex flex-wrap gap-2">{CASE_DATA.solution.steps.map(s=><span key={s} className="px-2 py-1 rounded-full bg-white border text-[11px]" style={{ borderColor:CARD_BORDER }}>{s}</span>)}</div>
                    </div>
                    <div className="mt-3 grid md:grid-cols-2 gap-3">
                      <SankeyDiagram highlight />
                      <div className="rounded-xl border bg-[#f6f5f3] p-3 text-[12px] leading-snug" style={{ borderColor:CARD_BORDER }}>
                        <div className="font-semibold">Interviewer lens</div><div className="mt-1 opacity-80">{CASE_DATA.solution.lens}</div>
                        <div className="mt-3 font-semibold">Common trap</div><div className="mt-1 opacity-80">{CASE_DATA.solution.trap}</div>
                        <div className="mt-3 font-semibold">Framework link</div><div className="mt-1">{CASE_DATA.solution.framework}</div>
                        <div className="mt-3 font-semibold">Time target</div><div className="mt-1">{CASE_DATA.solution.time}</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs font-semibold">Self-rate to save to weakness</div>
                      <div className="mt-2 flex gap-2">
                        {["Naive","Structured","MBB-level"].map(r=>(
                          <button key={r} onClick={()=>handleSelfRate(r)} className={`h-8 px-3 rounded-full border text-xs font-medium ${selfRating===r?"bg-black text-white":"bg-white"}`} style={{ borderColor:CARD_BORDER }}>{r}</button>
                        ))}
                      </div>
                      {selfRating && <div className="mt-2 text-[11px] text-green-700">Saved as {selfRating} • Day marked complete ✓</div>}
                    </div>

                    <div className="mt-5 rounded-[14px] border bg-white p-3" style={{ borderColor:CARD_BORDER }}>
                      <div className="text-xs font-semibold">Quick check — MCQ (answer hidden until pick)</div>
                      <div className="mt-2 text-[13px]">{CASE_DATA.mcq.q}</div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {CASE_DATA.mcq.opts.map((o,i)=>(
                          <button key={i} onClick={()=>setMcqPick(i)} className={`h-9 rounded-full border text-xs font-medium text-left px-3 ${mcqPick===i ? (i===CASE_DATA.mcq.ans?"bg-green-600 text-white border-green-600":"bg-red-50 border-red-200") : "bg-[#fbfaf8] hover:bg-white"}`} style={{ borderColor: mcqPick===i?undefined:CARD_BORDER }}>{o}</button>
                        ))}
                      </div>
                      {mcqPick!==null && <div className={`mt-2 text-[12px] p-2 rounded-lg ${mcqPick===CASE_DATA.mcq.ans?"bg-green-50 border border-green-200":"bg-amber-50 border border-amber-200"}`}>{CASE_DATA.mcq.exp}</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress / streak */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[20px] bg-white border p-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)]" style={{ borderColor:CARD_BORDER }}>
                  <div className="text-[11px] uppercase tracking-wide font-semibold opacity-60">Progress</div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative w-12 h-12"><svg viewBox="0 0 36 36" className="w-12 h-12 rotate-[-90deg]"><circle cx="18" cy="18" r="14" fill="none" stroke="#f0ece6" strokeWidth="4"/><circle cx="18" cy="18" r="14" fill="none" stroke="#111" strokeWidth="4" strokeDasharray={`${progressPct*0.88} 100`} strokeLinecap="round"/></svg><span className="absolute inset-0 grid place-items-center text-[12px] font-bold">{progressPct}%</span></div>
                    <div><div className="text-sm font-semibold">{completedDays.size}/80 done</div><div className="text-[11px] opacity-60">{conceptsViewed.size}/25 concepts • {challengeHistory.filter(c=>c.completed).length}/12 challenges</div></div>
                  </div>
                  <div className="mt-3 h-1.5 bg-[#f6f5f3] rounded-full overflow-hidden"><div className="h-full bg-black" style={{ width:`${progressPct}%` }} /></div>
                </div>
                <div className="rounded-[20px] bg-white border p-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)]" style={{ borderColor:CARD_BORDER }}>
                  <div className="text-[11px] uppercase tracking-wide font-semibold opacity-60">Streak 🔥</div>
                  <div className="mt-2 text-[22px] font-bold flex items-center gap-2"><Flame/> {completedDays.size} days</div>
                  <div className="text-[11px] opacity-60">Increments next day only — keep shipping</div>
                </div>
              </div>
            </div>
          )}

          {activeTab==="plan" && (
            <div className="space-y-5">
              <div className="rounded-[20px] bg-white border p-5 md:p-6" style={{ borderColor:CARD_BORDER }}>
                <h2 className="text-[18px] font-bold">80-Day Plan • 16 weeks • 4 months</h2>
                <p className="text-[12px] opacity-60 mt-1">Only current day expanded, previous ✓, future locked 🔒. Need 70% weekly quiz to unlock next.</p>
                <div className="mt-3 flex gap-2"><button onClick={()=>setActiveTab("modules")} className="h-8 px-3 rounded-full bg-black text-white text-xs font-semibold">Open Learning Modules 📚</button><span className="text-[11px] opacity-60 self-center">8 modules now linked to plan</span></div>
                <div className="mt-4 grid gap-3">
                  {weeks.map(w=>{
                    const isPastWeek = w.days[w.days.length-1] < currentDay;
                    const isCurrentWeek = w.days.includes(currentDay);
                    const isLocked = w.days[0] > currentDay+1;
                    return (
                      <div key={w.week} className={`rounded-[16px] border p-3 ${isCurrentWeek?"bg-black text-white border-black":"bg-[#fbfaf8]"} ${isLocked?"opacity-60 blur-[0.5px]":""}`} style={{ borderColor:isCurrentWeek?undefined:CARD_BORDER }}>
                        <div className="flex items-center justify-between">
                          <div className="text-[12px] font-semibold">Week {w.week} • {w.hours}h • {isPastWeek?"✓ Completed": isCurrentWeek?"Current":"Locked"}</div>
                          {isLocked && <Lock size={14}/>}
                        </div>
                        <div className="mt-2 flex gap-1.5 flex-wrap">
                          {w.days.map(d=>{
                            const done = completedDays.has(d);
                            const isToday = d===currentDay;
                            return <div key={d} className={`w-8 h-8 rounded-full grid place-items-center text-[11px] font-medium border ${done?"bg-green-600 text-white border-green-600": isToday?"bg-white text-black border-white":"bg-white/60 border-[#e8e6e1]"} ${isCurrentWeek && !isToday?"bg-white/10":""}`}>{done?<CheckCircle2 size={14}/>:d}</div>;
                          })}
                        </div>
                        {isCurrentWeek && <div className="mt-3 text-[11px] opacity-80">Focus: Market sizing math + Issue trees • Quiz Fri</div>}
                        {isLocked && <div className="mt-2 text-[11px]">Complete Day {currentDay} to unlock</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab==="concepts" && (
            <div className="space-y-4">
              <div className="rounded-[20px] bg-white border p-5 md:p-6" style={{ borderColor:CARD_BORDER }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[18px] font-bold">Concepts & Frameworks • 25</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40"/><input value={conceptsSearch} onChange={e=>setConceptsSearch(e.target.value)} placeholder="Search..." className="h-8 pl-8 pr-3 rounded-full border bg-[#fbfaf8] text-xs w-[160px] md:w-[220px] outline-none focus:border-black" style={{ borderColor:CARD_BORDER }}/></div>
                    <span className="text-[11px] opacity-60">{conceptsViewed.size}/25 viewed</span>
                  </div>
                </div>
                <div className="mt-5 grid md:grid-cols-2 gap-4">
                  {filteredConcepts.map(f=>{
                    const expanded = expandedConcept===f.id;
                    const viewed = conceptsViewed.has(f.id);
                    return (
                      <div key={f.id} className={`rounded-[16px] border p-4 transition cursor-pointer ${expanded?"bg-black text-white border-black":"bg-[#fbfaf8] hover:bg-white"} `} style={{ borderColor: expanded?undefined:CARD_BORDER }} onClick={()=>{setExpandedConcept(expanded?null:f.id); setConceptsViewed(s=>{const ns=new Set(s); ns.add(f.id); return ns;}); if(!viewed) setXp(x=>x+5);}}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2"><span className="text-[16px]">{f.icon}</span><span className="text-[13px] font-bold">{f.name}</span>{viewed&&<CheckCircle2 size={12} className={expanded?"text-white":"text-green-600"}/>}</div>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${expanded?"bg-white/20":"bg-white border"}`} style={{ borderColor: expanded?undefined:CARD_BORDER }}>2-min drill</span>
                        </div>
                        <div className={`mt-2 text-[11px] uppercase tracking-wide font-semibold ${expanded?"opacity-60":"opacity-50"}`}>When: {f.when}</div>
                        <div className="mt-3 flex items-center gap-2">
                          <MiniTree type={f.id==="pyramid"?"pyramid": f.id.includes("issue")||f.id==="mece"?"tree":"profit"} />
                          <div className={`text-[11px] leading-snug ${expanded?"opacity-80":"opacity-70"}`}><span className="font-semibold">Structure:</span> {f.struct.slice(0,70)}<br/><span className="font-semibold">Ex:</span> {f.ex.slice(0,80)}</div>
                        </div>
                        {expanded && (
                          <div className="mt-3 pt-3 border-t border-white/20 space-y-2 text-[12px]">
                            <div><span className="font-semibold">Example:</span> {f.ex}</div>
                            <div className="flex gap-2 items-start"><AlertTriangle size={12} className="mt-0.5 shrink-0"/><span><span className="font-semibold">Trap:</span> {f.trap}</span></div>
                            <div className="rounded-xl bg-white text-black p-3 mt-2"><div className="text-[11px] font-semibold">2-min drill</div><div className="mt-1">{f.drill.q}</div><div className="mt-2 flex items-center gap-2"><Eye size={12}/><span className="text-[11px] opacity-60">Think 10s then reveal — </span><button onClick={e=>{e.stopPropagation(); const el=document.getElementById(`drill-${f.id}`); if(el) el.classList.toggle("hidden");}} className="text-[11px] underline font-semibold">Reveal</button></div><div id={`drill-${f.id}`} className="hidden mt-2 text-[11px] font-medium bg-[#f6f5f3] rounded-lg p-2">→ {f.drill.a}</div></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab==="challenges" && (
            <div className="space-y-4">
              <div className="rounded-[20px] bg-white border p-5 md:p-6" style={{ borderColor:CARD_BORDER }}>
                <div className="flex items-center justify-between"><h2 className="text-[18px] font-bold flex items-center gap-2"><Swords size={18}/> Challenges 🔥 • 12</h2><span className="text-[11px] opacity-60">{challengeHistory.filter(c=>c.completed).length}/12 done • {xp} XP</span></div>
                <div className="mt-4 flex gap-2 flex-wrap">{[
                  {id:"micro", label:"Daily Micro 5min"},
                  {id:"battle", label:"Weekly Battle"},
                  {id:"blitz", label:"Math Blitz 60s"},
                  {id:"fermi", label:"Fermi Friday"},
                ].map(t=><span key={t.id} className="px-2.5 py-1 rounded-full bg-[#f6f5f3] border text-[11px] font-medium" style={{ borderColor:CARD_BORDER }}>{t.label}</span>)}</div>

                <div className="mt-5 grid md:grid-cols-2 gap-4">
                  {CHALLENGES_DATA.map(ch=>{
                    const hist = challengeHistory.find(h=>h.id===ch.id);
                    return (
                      <div key={ch.id} className="rounded-[16px] border bg-[#fbfaf8] p-4 hover:bg-white transition" style={{ borderColor:CARD_BORDER }}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="px-2 py-1 rounded-full bg-black text-white text-[10px] font-semibold uppercase tracking-wide">{ch.type} • {ch.diff}</div>
                          {hist?.completed && <span className="flex items-center gap-1 text-[11px] text-green-700 font-medium"><CheckCircle2 size={12}/> {hist.bestTime}s best</span>}
                        </div>
                        <div className="mt-2 text-[13px] font-bold leading-tight">{ch.title}</div>
                        <div className="mt-1 text-[11px] opacity-60 flex items-center gap-2"><Timer size={12}/>{ch.time} • <Star size={12}/>+{ch.xp} XP • {ch.desc}</div>
                        <button onClick={()=>{setActiveChallenge(ch); setChThink(""); setChStage(1); setChBlur(false);}} className="mt-3 h-8 px-3 rounded-full bg-black text-white text-xs font-semibold w-full">{hist?.completed?"Replay • Beat best":"Play challenge →"}</button>
                      </div>
                    );
                  })}
                </div>

                {activeChallenge && (
                  <div className="mt-6 rounded-[20px] border-2 border-black bg-white p-5">
                    <div className="flex items-center justify-between"><div className="text-[12px] font-bold flex items-center gap-2"><Swords size={14}/> {activeChallenge.title} • {activeChallenge.type}</div><button onClick={()=>setActiveChallenge(null)} className="h-7 w-7 rounded-full bg-[#f6f5f3] border grid place-items-center text-xs" style={{ borderColor:CARD_BORDER }}>✕</button></div>
                    
                    <div className="mt-4 relative rounded-[16px] border bg-[#fbfaf8] overflow-hidden" style={{ borderColor:CARD_BORDER }}>
                      <div className="absolute top-3 right-3 z-10"><button onClick={()=>setChBlur(v=>!v)} className="w-8 h-8 rounded-full bg-white border shadow grid place-items-center" style={{ borderColor:CARD_BORDER }}>{chBlur?<EyeOff size={14}/>:<Eye size={14}/>}</button></div>
                      <div className="p-3"><div className="text-[10px] uppercase tracking-wide font-semibold opacity-60">Challenge brief • blurred until 👁️</div>
                        <div className={`mt-2 text-[13px] transition-all ${chBlur?"":"blur-[10px] opacity-50 select-none"}`}>{activeChallenge.q}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-[12px] font-semibold flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-black text-white grid place-items-center text-[10px]">1</div> Think dwell-first</div>
                      <textarea value={chThink} onChange={e=>setChThink(e.target.value)} placeholder="Your thinking — 15 chars to unlock" className="mt-2 w-full min-h-[72px] rounded-[14px] border bg-[#fbfaf8] p-3 text-[13px] outline-none focus:border-black" style={{ borderColor:CARD_BORDER }}/>
                      <div className="mt-2 flex justify-between items-center"><span className="text-[11px] opacity-60">{chThink.length}/15</span><button disabled={chThink.length<15} onClick={()=>setChStage(2)} className={`h-8 px-3 rounded-full text-xs font-semibold ${chThink.length>=15?"bg-black text-white":"bg-[#eee] text-[#999]"}`}>Check → Approach</button></div>
                    </div>

                    {chStage>=2 && (
                      <div className="mt-4 rounded-[14px] border bg-[#f6f5f3] p-3" style={{ borderColor:CARD_BORDER }}>
                        <div className="text-[11px] font-semibold">Approach — no numbers yet</div><div className="mt-1 text-[12px]">{activeChallenge.approach}</div>
                        <button onClick={()=>setChStage(3)} className="mt-2 h-7 px-2.5 rounded-full bg-black text-white text-[11px] font-semibold">Reveal answer →</button>
                      </div>
                    )}
                    {chStage>=3 && (
                      <div className="mt-3 rounded-[14px] border bg-white p-3" style={{ borderColor:CARD_BORDER }}>
                        <div className="text-[11px] font-semibold">Final • Answer + trap</div><div className="mt-1 text-[12px]"><span className="font-semibold">Ans:</span> {activeChallenge.ans}</div><div className="mt-1 text-[11px] bg-amber-50 border border-amber-200 rounded-full px-2 py-1 inline-flex gap-1"><AlertTriangle size={12}/> Trap: {activeChallenge.trap}</div>
                        <button onClick={()=>{setChallengeHistory(h=>{ const ex=h.find(x=>x.id===activeChallenge.id); if(ex) return h.map(x=> x.id===activeChallenge.id? {...x, completed:true, bestTime: Math.min(x.bestTime, Math.floor(Math.random()*40+20))}:x); else return [...h, {id:activeChallenge.id,bestTime: Math.floor(Math.random()*40+30), completed:true}];}); setXp(x=>x+activeChallenge.xp); setChStage(4);}} className="mt-3 h-8 px-3 rounded-full bg-black text-white text-xs font-semibold w-full">Mark done +{activeChallenge.xp} XP ✓</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab==="modules" && (
            <div className="space-y-4">
              <div className="rounded-[20px] bg-white border p-5 md:p-6" style={{ borderColor:CARD_BORDER }}>
                <h2 className="text-[18px] font-bold flex items-center gap-2"><BookOpen size={18}/> Learning Modules • 8 • {MODULES_DATA.reduce((a,m)=>a+m.lessons.length,0)} lessons</h2>
                <div className="mt-2 text-[11px] opacity-60">Each lesson = Think (15 chars) → Approach → Explanation + 2Q quiz. +10 XP per lesson.</div>
                <div className="mt-5 grid gap-4">
                  {MODULES_DATA.map(mod=>{
                    const prog = modulesProgress[mod.id] || new Set();
                    const pct = Math.round((prog.size / mod.lessons.length)*100);
                    const isActive = activeModule===mod.id;
                    return (
                      <div key={mod.id} className={`rounded-[16px] border p-4 ${isActive?"bg-black text-white border-black":"bg-[#fbfaf8] hover:bg-white"}`} style={{ borderColor: isActive?undefined:CARD_BORDER }}>
                        <div className="flex items-center justify-between gap-3">
                          <div><div className="text-[13px] font-bold">Module {mod.id}: {mod.title}</div><div className="text-[11px] opacity-60 mt-0.5">{mod.desc} • {mod.lessons.length} lessons • +{mod.xp} XP</div></div>
                          <div className="flex items-center gap-2"><div className="text-[11px] font-semibold">{prog.size}/{mod.lessons.length}</div><div className="w-12 h-1.5 rounded-full bg-[#e8e6e1] overflow-hidden"><div className="h-full bg-black" style={{ width:`${pct}%`, background: isActive?"white":"black" }} /></div></div>
                        </div>
                        <div className="mt-2 flex gap-1.5 flex-wrap">
                          {mod.lessons.map((_,i)=> <div key={i} className={`w-6 h-6 rounded-full grid place-items-center text-[10px] border ${prog.has(i)?"bg-green-600 text-white border-green-600": isActive?"bg-white/20 border-white/20":"bg-white border-[#e8e6e1]"}`}>{prog.has(i)?"✓":i+1}</div>)}
                        </div>
                        <button onClick={()=>{setActiveModule(isActive?null:mod.id); setActiveLesson(0); setLessonThink(""); setLessonStage(1); setLessonQuizPick([null,null]);}} className={`mt-3 h-8 px-3 rounded-full text-xs font-semibold ${isActive?"bg-white text-black":"bg-black text-white"}`}>{isActive?"Close":"Open module →"}</button>

                        {isActive && (
                          <div className="mt-4 rounded-[14px] bg-white text-black p-4 border" style={{ borderColor:CARD_BORDER }}>
                            <div className="flex items-center justify-between"><div className="text-[12px] font-bold">Lesson {activeLesson+1}: {mod.lessons[activeLesson].t}</div><div className="flex gap-1">{mod.lessons.map((_,i)=><button key={i} onClick={()=>{setActiveLesson(i); setLessonThink(""); setLessonStage(1); setLessonQuizPick([null,null]);}} className={`w-6 h-6 rounded-full text-[10px] ${i===activeLesson?"bg-black text-white":"bg-[#f6f5f3] border"}`} style={{ borderColor:CARD_BORDER }}>{i+1}</button>)}</div></div>
                            <div className="mt-2 text-[11px] opacity-70">{mod.lessons[activeLesson].c}</div>
                            <div className="mt-2 text-[12px]"><span className="font-semibold">Example:</span> {mod.lessons[activeLesson].ex}</div>
                            
                            <div className="mt-3">
                              <div className="text-[11px] font-semibold">Try it yourself — dwell first</div>
                              <textarea value={lessonThink} onChange={e=>setLessonThink(e.target.value)} placeholder={mod.lessons[activeLesson].try} className="mt-1 w-full min-h-[64px] rounded-[12px] border bg-[#fbfaf8] p-2.5 text-[12px] outline-none focus:border-black" style={{ borderColor:CARD_BORDER }}/>
                              <div className="mt-1 flex justify-between"><span className="text-[10px] opacity-60">{lessonThink.length}/15</span><button disabled={lessonThink.length<15} onClick={()=>setLessonStage(2)} className={`h-7 px-2.5 rounded-full text-[11px] font-semibold ${lessonThink.length>=15?"bg-black text-white":"bg-[#eee]"}`}>Check →</button></div>
                            </div>

                            {lessonStage>=2 && (
                              <div className="mt-3 rounded-[12px] bg-[#f6f5f3] border p-2.5" style={{ borderColor:CARD_BORDER }}>
                                <div className="text-[11px] font-semibold">Approach</div><div className="mt-1 text-[12px]">{mod.lessons[activeLesson].approach}</div>
                                <button onClick={()=>setLessonStage(3)} className="mt-2 h-7 px-2.5 rounded-full bg-black text-white text-[11px]">Show explanation →</button>
                              </div>
                            )}
                            {lessonStage>=3 && (
                              <div className="mt-2 space-y-2">
                                <div className="rounded-[12px] border bg-white p-2.5 text-[12px]" style={{ borderColor:CARD_BORDER }}><span className="font-semibold">Explanation:</span> {mod.lessons[activeLesson].exp}</div>
                                <div className="rounded-[12px] border bg-[#fbfaf8] p-2.5" style={{ borderColor:CARD_BORDER }}>
                                  <div className="text-[11px] font-semibold">Mini quiz — 2 Qs</div>
                                  {mod.lessons[activeLesson].quiz.map((q,i)=>(
                                    <div key={i} className="mt-2">
                                      <div className="text-[11px]">{i+1}. {q.q}</div>
                                      <div className="mt-1 flex gap-1 flex-wrap">{q.opts.map((o,oi)=><button key={oi} onClick={()=>{const ns=[...lessonQuizPick]; ns[i]=oi; setLessonQuizPick(ns);}} className={`px-2 py-1 rounded-full border text-[10px] ${lessonQuizPick[i]===oi ? (oi===q.a?"bg-green-600 text-white border-green-600":"bg-red-100 border-red-200") : "bg-white"}`} style={{ borderColor:CARD_BORDER }}>{o}</button>)}</div>
                                    </div>
                                  ))}
                                  {lessonQuizPick.every((p,i)=> p!==null) && (
                                    <button onClick={()=>{setModulesProgress(prev=>{const ns={...prev}; const s=new Set(ns[mod.id]||[]); const was=s.has(activeLesson); s.add(activeLesson); ns[mod.id]=s; return ns;}); if(!(modulesProgress[mod.id]?.has(activeLesson))) setXp(x=>x+10); if(activeLesson < mod.lessons.length-1){ setActiveLesson(a=>a+1); setLessonThink(""); setLessonStage(1); setLessonQuizPick([null,null]);} }} className="mt-3 h-8 px-3 rounded-full bg-black text-white text-xs font-semibold w-full">{activeLesson < mod.lessons.length-1 ? "Complete +10 XP & Next lesson →" : "Complete module +10 XP ✓"}</button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab==="math" && (
            <div className="space-y-5">
              <div className="rounded-[20px] bg-white border p-5 md:p-6" style={{ borderColor:CARD_BORDER }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[18px] font-bold flex items-center gap-2"><Zap size={18}/> Math Trainer • Expanded</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setShowFormula(v=>!v)} className="h-8 px-3 rounded-full border bg-[#f6f5f3] text-xs font-medium" style={{ borderColor:CARD_BORDER }}>Formula Sheet</button>
                    <button onClick={()=>{ const blob=new Blob([JSON.stringify(mathHistory,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="math-history.json"; a.click(); URL.revokeObjectURL(url); }} className="h-8 px-3 rounded-full border text-xs">Export history</button>
                  </div>
                </div>

                {showFormula && (
                  <div className="mt-3 grid md:grid-cols-3 gap-2 text-[11px]">
                    {[
                      "BE = FC/(P-VC) • Units",
                      "CAGR = (End/Start)^(1/n)-1",
                      "Weighted = Σw×v",
                      "% tricks: 1/8=12.5% 3/8=37.5% 5/8=62.5% 1/6≈16.66% 1/16=6.25%",
                      "Rule72: Double≈72/r Triple≈114/r",
                      "Reverse%: orig = discounted/(1-d%)",
                    ].map(f=><div key={f} className="rounded-full bg-[#f6f5f3] border px-3 py-1" style={{ borderColor:CARD_BORDER }}>{f}</div>)}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2 p-1 rounded-full bg-[#f6f5f3] w-fit">
                  {[
                    { id:"learn", label:"Untimed Learn" },
                    { id:"sprint", label:"Timed Sprint" },
                    { id:"weakness", label:"Weakness Drill" },
                  ].map(m=>(
                    <button key={m.id} onClick={()=>{setMathMode(m.id as any); setSprintLeft(mathQCount* (mathDiff==="interview"?12: mathDiff==="mbb"?8:5)); setMathFeedback(null);}} className={`h-8 px-4 rounded-full text-xs font-semibold transition ${mathMode===m.id?"bg-black text-white":"hover:bg-white"}`}>{m.label}</button>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 items-center max-w-full">
                  <div className="flex gap-1 flex-wrap">{CATS.map(c=><button key={c} onClick={()=>setMathCat(c)} className={`h-7 px-2.5 rounded-full border text-[11px] ${mathCat===c?"bg-black text-white border-black":"bg-white"}`} style={{ borderColor:mathCat===c?undefined:CARD_BORDER }}>{c}</button>)}</div>
                  <div className="h-4 w-px bg-[#e8e6e1] hidden md:block" />
                  <div className="flex gap-1">{ (["interview","mbb","god"] as const).map(d=><button key={d} onClick={()=>setMathDiff(d)} className={`h-7 px-2.5 rounded-full border text-[11px] capitalize ${mathDiff===d?"bg-black text-white":"bg-white"}`} style={{ borderColor:CARD_BORDER }}>{d} {d==="interview"?"12s":d==="mbb"?"8s":"5s"}</button>)}</div>
                  <div className="flex gap-1">{([5,10,20] as const).map(n=><button key={n} onClick={()=>setMathQCount(n)} className={`h-7 px-2.5 rounded-full border text-[11px] ${mathQCount===n?"bg-black text-white":"bg-white"}`} style={{ borderColor:CARD_BORDER }}>{n} Qs</button>)}</div>
                  <label className="flex items-center gap-1 text-[11px] ml-2"><input type="checkbox" checked={weakOnly} onChange={e=>setWeakOnly(e.target.checked)}/> weak only</label>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px]"><span>Daily Goal 20 Qs</span><span>{dailyDone}/20</span></div>
                  <div className="mt-1 h-2 rounded-full bg-[#f6f5f3] overflow-hidden"><div className="h-full bg-black" style={{ width:`${(dailyDone/20)*100}%` }}/></div>
                </div>

                {currentMath ? (
                  <div className="mt-5 rounded-[16px] border bg-[#fbfaf8] p-4" style={{ borderColor:CARD_BORDER }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-wide font-semibold opacity-60">{currentMath.cat} • Q {mathIdx+1}/{activeMathQs.length} • Target {targetTime}s</div>
                        <div className="mt-1 text-[13px] font-medium italic opacity-80">“{currentMath.interview}”</div>
                        <div className="mt-2 text-[18px] font-bold">{currentMath.q} = ?</div>
                      </div>
                      {mathMode==="sprint" && <div className="shrink-0 w-12 h-12 rounded-full bg-black text-white grid place-items-center font-bold text-sm">{Math.floor(sprintLeft/60)}:{String(sprintLeft%60).padStart(2,"0")}</div>}
                    </div>

                    {!mathFeedback ? (
                      <div className="mt-4 flex gap-2">
                        <input value={mathInput} onChange={e=>setMathInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleMathSubmit()} placeholder="Your answer" className="flex-1 h-10 rounded-full border bg-white px-4 text-sm outline-none focus:border-black" style={{ borderColor:CARD_BORDER }} />
                        <button onClick={handleMathSubmit} className="h-10 px-5 rounded-full bg-black text-white text-sm font-semibold">Submit</button>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border bg-white p-3" style={{ borderColor:CARD_BORDER }}>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${mathFeedback.correct?"bg-green-50 border border-green-200 text-green-700":"bg-red-50 border border-red-200 text-red-700"}`}>{mathFeedback.correct?"✓ Correct":"✗ Off"} • {mathFeedback.time}s vs {targetTime}s target • {mathFeedback.time<=targetTime?"Fast":"Slow"}</div>
                        <div className="mt-2 text-[13px]"><span className="font-semibold">Trick:</span> {mathFeedback.trick}</div>
                        <div className="mt-2 space-y-1 text-[12px]">{mathFeedback.steps.map(s=><div key={s} className="flex gap-2"><span className="opacity-40">•</span>{s}</div>)}</div>
                        <div className="mt-3 flex gap-2">
                          <button onClick={nextMath} className="h-8 px-3 rounded-full bg-black text-white text-xs font-semibold">Got it / Next →</button>
                          <button onClick={()=>{setMathFeedback(null); setMathInput("");}} className="h-8 px-3 rounded-full border bg-[#f6f5f3] text-xs" style={{ borderColor:CARD_BORDER }}>Another like this</button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : <div className="mt-4 text-[13px] opacity-60">No Qs for filter — switch category</div>}

                {/* Stats */}
                <div className="mt-6 grid md:grid-cols-3 gap-3">
                  <div className="rounded-[14px] border bg-white p-3" style={{ borderColor:CARD_BORDER }}>
                    <div className="text-[10px] uppercase tracking-wide font-semibold opacity-60">Accuracy</div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="relative w-12 h-12"><svg viewBox="0 0 36 36" className="w-12 h-12 rotate-[-90deg]"><circle cx="18" cy="18" r="14" fill="none" stroke="#f0ece6" strokeWidth="4"/><circle cx="18" cy="18" r="14" fill="none" stroke="#111" strokeWidth="4" strokeDasharray={`${(mathHistory.filter(h=>h.correct).length/Math.max(1,mathHistory.length))*88} 100`} /></svg><span className="absolute inset-0 grid place-items-center text-[11px] font-bold">{mathHistory.length? Math.round(mathHistory.filter(h=>h.correct).length/mathHistory.length*100):0}%</span></div>
                      <div className="text-[12px]"><div>Best streak: {(() => { let b=0,c=0; mathHistory.forEach(h=>{ if(h.correct){c++; b=Math.max(b,c);} else c=0;}); return b;})()}</div><div className="opacity-60">Avg {mathHistory.length? (mathHistory.reduce((a,b)=>a+b.time,0)/mathHistory.length).toFixed(1):"-"}s</div></div>
                    </div>
                  </div>
                  <div className="rounded-[14px] border bg-white p-3" style={{ borderColor:CARD_BORDER }}>
                    <div className="text-[10px] uppercase tracking-wide font-semibold opacity-60">Time distribution</div>
                    <div className="mt-2 flex items-end gap-1 h-[36px]">
                      {[4,8,12,16,20].map(t=>{
                        const cnt = mathHistory.filter(h=>h.time>=t-4 && h.time<t).length;
                        const hgt = Math.max(4, cnt*10);
                        return <div key={t} className="flex-1 bg-black rounded-t" style={{ height:hgt }} title={`${t-4}-${t}s: ${cnt}`} />;
                      })}
                    </div>
                    <div className="mt-1 flex justify-between text-[9px] opacity-60"><span>0s</span><span>20s+</span></div>
                  </div>
                  <div className="rounded-[14px] border bg-white p-3" style={{ borderColor:CARD_BORDER }}>
                    <div className="text-[10px] uppercase tracking-wide font-semibold opacity-60">Last 20</div>
                    <div className="mt-2 flex flex-wrap gap-1">{mathHistory.slice(-20).map((h,i)=><span key={i} className={`w-6 h-6 rounded-full grid place-items-center text-[10px] ${h.correct?"bg-green-600 text-white":"bg-red-100"}`}>{h.time}</span>)}</div>
                  </div>
                </div>

                <div className="mt-4 rounded-[14px] border bg-[#f6f5f3] p-3" style={{ borderColor:CARD_BORDER }}>
                  <div className="text-[11px] font-semibold">Personal bests</div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    {Object.entries(mathHistory.reduce((acc:any,h)=>{ acc[h.cat]=acc[h.cat]||{best:999, cnt:0}; acc[h.cat].best=Math.min(acc[h.cat].best,h.time); acc[h.cat].cnt++; return acc;},{})).map(([cat,v]:any)=><div key={cat} className="rounded-full bg-white border px-2 py-1 flex justify-between" style={{ borderColor:CARD_BORDER }}><span>{cat}</span><span className="font-bold">{v.best}s</span></div>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab==="pei" && (
            <div className="rounded-[20px] bg-white border p-5 md:p-6 space-y-4" style={{ borderColor:CARD_BORDER }}>
              <h2 className="text-[18px] font-bold">PEI Builder • McKinsey 6 qualities</h2>
              <div className="flex flex-wrap gap-1">{["Leadership","Drive","Resilience","Personal Impact","Entrepreneurship","Inclusive"].map(q=><span key={q} className="px-2.5 py-1 rounded-full bg-black text-white text-[11px]">{q}</span>)}</div>
              {[
                { k:"lead", label:"Leadership — mile-deep follow-ups: Why you? What was hard? What would you do differently?" },
                { k:"impact", label:"Impact — quantify, conflict, influence without authority" },
                { k:"drive", label:"Drive — why this story matters, what pushed you" },
              ].map(f=>(
                <div key={f.k}>
                  <div className="text-[12px] font-semibold">{f.label}</div>
                  <textarea value={(pei as any)[f.k]} onChange={e=>setPei(p=>({...p,[f.k]:e.target.value}))} className="mt-2 w-full min-h-[88px] rounded-[14px] border bg-[#fbfaf8] p-3 text-[13px] outline-none focus:border-black" style={{ borderColor:CARD_BORDER }} />
                </div>
              ))}
              <div className="text-[11px] opacity-60">Session draft — Export via header • +10 XP when you complete lesson in Modules</div>
            </div>
          )}

          {activeTab==="mocks" && (
            <div className="rounded-[20px] bg-white border p-5 md:p-6" style={{ borderColor:CARD_BORDER }}>
              <h2 className="text-[18px] font-bold flex items-center gap-2"><Clock size={18}/> Mocks • 25-min timer with push</h2>
              <div className="mt-4 rounded-[16px] bg-[#fbfaf8] border p-4 flex items-center justify-between" style={{ borderColor:CARD_BORDER }}>
                <div><div className="text-[12px] font-semibold">Current mock: {CASE_DATA.title}</div><div className="text-[22px] font-bold font-mono mt-1">{Math.floor(mockSec/60)}:{String(mockSec%60).padStart(2,"0")} / 25:00</div><div className="text-[11px] opacity-60 mt-1">Interviewer pushes: “Why? What if wrong? What’s alternative?”</div></div>
                <button onClick={()=>setMockRunning(r=>!r)} className={`h-10 px-5 rounded-full font-semibold text-sm ${mockRunning?"bg-white border":"bg-black text-white"}`} style={{ borderColor:CARD_BORDER }}>{mockRunning?"Pause":"Start 25m"}</button>
              </div>
              <div className="mt-4 grid md:grid-cols-3 gap-2 text-[12px]">
                {["Why that unit?","What if HH size 2.0?","Alternative: cars per person?"].map(p=><div key={p} className="rounded-full bg-[#f6f5f3] border px-3 py-2" style={{ borderColor:CARD_BORDER }}>Push: {p}</div>)}
              </div>
            </div>
          )}
        </main>

        {/* Right rail 360px sticky — math mini on dashboard */}
        <aside className="hidden xl:block w-[360px] shrink-0 sticky top-[88px] h-fit space-y-3">
          {activeTab==="dashboard" && (
            <>
              <div className="rounded-[20px] bg-white border p-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)]" style={{ borderColor:CARD_BORDER }}>
                <div className="flex items-center justify-between"><div className="text-[12px] font-bold flex items-center gap-2"><Zap size={14}/> Math Trainer</div><button onClick={()=>setActiveTab("math")} className="text-[11px] underline">Open full</button></div>
                <div className="mt-3 flex gap-1 p-1 rounded-full bg-[#f6f5f3]">{["learn","sprint","weakness"].map(m=><button key={m} onClick={()=>setMathMode(m as any)} className={`flex-1 h-7 rounded-full text-[11px] font-medium capitalize ${mathMode===m?"bg-black text-white":""}`}>{m}</button>)}</div>
                <div className="mt-3 text-[12px] font-semibold">{currentMath? currentMath.q:"No Q"}</div>
                <div className="mt-2 flex gap-2"><input value={mathInput} onChange={e=>setMathInput(e.target.value)} placeholder="Answer" className="flex-1 h-8 rounded-full border bg-[#fbfaf8] px-3 text-xs" style={{ borderColor:CARD_BORDER }}/><button onClick={handleMathSubmit} className="h-8 px-3 rounded-full bg-black text-white text-xs">Go</button></div>
                {mathFeedback && <div className="mt-2 text-[11px]"><span className="font-semibold">{mathFeedback.correct?"✓":"✗"}</span> {mathFeedback.trick}</div>}
                <div className="mt-3 h-1.5 bg-[#f6f5f3] rounded-full overflow-hidden"><div className="h-full bg-black" style={{ width:`${(dailyDone/20)*100}%` }}/></div><div className="mt-1 text-[10px] opacity-60">{dailyDone}/20 daily goal</div>
              </div>
              <div className="rounded-[20px] bg-[#f6f5f3] border p-4" style={{ borderColor:CARD_BORDER }}>
                <div className="text-[11px] font-semibold flex items-center gap-1"><Lightbulb size={12}/> Formula quick + Modules</div>
                <div className="mt-2 space-y-1 text-[11px]"><div>BE = FC/(P-VC)</div><div>Rule72: Double 72/r</div><div>12.5%=1/8 • 37.5%=3/8</div></div>
                <div className="mt-3 pt-3 border-t" style={{ borderColor:CARD_BORDER }}><div className="text-[11px] font-semibold flex items-center gap-1"><GraduationCap size={12}/> Continue Learning</div><div className="mt-2 text-[11px]">{MODULES_DATA[0].title} • {MODULES_DATA[0].lessons[0].t.slice(0,30)}...</div><button onClick={()=>setActiveTab("modules")} className="mt-2 h-7 px-3 rounded-full bg-black text-white text-[11px] font-semibold">Open Modules 📚</button></div>
              </div>
              <div className="rounded-[20px] bg-white border p-4" style={{ borderColor:CARD_BORDER }}>
                <div className="text-[11px] font-semibold flex items-center gap-1"><Swords size={12}/> Challenges</div>
                <div className="mt-2 space-y-2">{CHALLENGES_DATA.slice(0,3).map(c=><div key={c.id} className="flex items-center justify-between text-[11px]"><span>{c.title.slice(0,22)}...</span><span className="opacity-60">+{c.xp} XP</span></div>)}</div>
                <button onClick={()=>setActiveTab("challenges")} className="mt-3 h-7 w-full rounded-full bg-[#f6f5f3] border text-[11px] font-medium" style={{ borderColor:CARD_BORDER }}>View all 12 →</button>
              </div>
            </>
          )}
          {activeTab!=="dashboard" && (
            <div className="rounded-[20px] bg-white border p-4" style={{ borderColor:CARD_BORDER }}>
              <div className="text-[11px] font-semibold">Progress snapshot</div>
              <div className="mt-2 space-y-2 text-[11px]">
                <div className="flex justify-between"><span>Concepts</span><span className="font-semibold">{conceptsViewed.size}/25</span></div>
                <div className="h-1 rounded-full bg-[#f6f5f3] overflow-hidden"><div className="h-full bg-black" style={{ width:`${(conceptsViewed.size/25)*100}%` }}/></div>
                <div className="flex justify-between"><span>Challenges</span><span className="font-semibold">{challengeHistory.filter(c=>c.completed).length}/12</span></div>
                <div className="h-1 rounded-full bg-[#f6f5f3] overflow-hidden"><div className="h-full bg-black" style={{ width:`${(challengeHistory.filter(c=>c.completed).length/12)*100}%` }}/></div>
                <div className="flex justify-between"><span>Modules</span><span className="font-semibold">{Object.values(modulesProgress).reduce((a,s:any)=>a+s.size,0)}/{MODULES_DATA.reduce((a,m)=>a+m.lessons.length,0)} lessons</span></div>
                <div className="h-1 rounded-full bg-[#f6f5f3] overflow-hidden"><div className="h-full bg-black" style={{ width:`${(Object.values(modulesProgress).reduce((a,s:any)=>a+s.size,0)/MODULES_DATA.reduce((a,m)=>a+m.lessons.length,0))*100}%` }}/></div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile bottom tabs */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t px-2 py-2 flex gap-1 overflow-x-auto max-w-[100vw]" style={{ borderColor:CARD_BORDER }}>
        {[
          { id:"dashboard", label:"Dash", icon:BarChart3 },
          { id:"plan", label:"Plan", icon:Target },
          { id:"concepts", label:"Concepts", icon:Brain },
          { id:"challenges", label:"Challenges", icon:Swords },
          { id:"modules", label:"Modules", icon:BookOpen },
          { id:"math", label:"Math", icon:Zap },
        ].map(n=>(
          <button key={n.id} onClick={()=>{setActiveTab(n.id as any); setNavFlash(`Opened ${n.label}`);}} className={`flex-1 min-w-[54px] h-10 rounded-full flex flex-col items-center justify-center gap-0.5 text-[9px] font-medium ${activeTab===n.id?"bg-black text-white":"bg-[#f6f5f3]"}`}><n.icon size={14}/>{n.label}</button>
        ))}
      </div>
      <div className="h-[72px] lg:hidden" />
    </div>
  );
}
