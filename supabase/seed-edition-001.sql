-- OSA Intelligence — Edition 001
-- Curated starter feed. Each entry links to its original publisher/source.
-- Safe to re-run: slug conflicts update the existing record.

insert into public.feed_entries
  (slug, category, eyebrow, title, summary, source_name, source_url, published_at, reading_time_minutes, signal_level, is_featured, status)
values
(
  'global-equity-fund-inflows-2026-11-06',
  'Markets',
  'GLOBAL CAPITAL FLOWS',
  'Global equity funds record a seventh straight week of inflows',
  'Global equity funds attracted $38.63 billion in the week through November 4, the seventh consecutive week of inflows. US, European and Asian funds all gained, while money-market funds also saw unusually large inflows. Why it matters: the figures show continued investor demand for risk assets, but the simultaneous strength in cash allocations and concerns about AI spending point to a market that is not uniformly risk-on. Watch regional flows, rates and sector rotation rather than treating aggregate inflows as a directional signal.',
  'Reuters',
  'https://www.reuters.com/world/china/global-markets-flows-graphic-2026-11-06/',
  '2026-11-06T12:00:00Z',
  4,
  'high_signal',
  true,
  'published'
),
(
  'zipline-walmart-expansion-funding-2026-11-05',
  'Startups',
  'VENTURE CAPITAL & LOGISTICS',
  'Zipline raises $1.5 billion as Walmart drone-delivery network expands',
  'Zipline reportedly closed $1.5 billion in fresh funding at a $21.5 billion valuation while expanding its commercial partnership with Walmart by adding 300 delivery sites. Why it matters: the story combines venture financing with evidence of scaled commercial distribution. For investors, the key questions are delivery economics, utilisation, regulatory permissions and whether retail partnerships can turn autonomous logistics into a repeatable business.',
  'Bloomberg',
  'https://www.bloomberg.com/news/articles/2026-11-05/zipline-tops-21-billion-valuation-adds-300-walmart-drone-sites',
  '2026-11-05T12:00:00Z',
  5,
  'high_signal',
  false,
  'published'
),
(
  'oracle-ai-analytics-financial-services-2026-11-10',
  'Technology',
  'AI IN FINANCIAL SERVICES',
  'Oracle brings conversational AI to treasury and customer analytics',
  'Oracle announced global availability of two financial-services analytics applications that combine curated banking data with natural-language exploration and automated insight discovery. Treasury Analytics focuses on liquidity, funding, cash flow and balance-sheet risk; Customer Analytics covers profitability, product adoption and retention. Why it matters: the competitive opportunity in enterprise AI is shifting from generic chat interfaces toward governed, domain-specific workflows connected to trusted operational data.',
  'Oracle',
  'https://www.oracle.com/news/announcement/oracle-introduces-financial-services-data-intelligence-with-ai-powered-treasury-and-customer-analytics-2026-11-10/',
  '2026-11-10T13:00:00Z',
  5,
  'high_signal',
  false,
  'published'
),
(
  'global-tech-hiring-skills-priority-q4-2026',
  'Career',
  'GLOBAL CAREER SIGNAL',
  'Global tech employers put AI capability and human skills in focus',
  'ManpowerGroup’s Q4 2026 Tech Talent Outlook, based on 4,258 employers across 42 countries, reported a global tech Net Employment Outlook of 37%. It found AI modelling and application development, AI literacy, communication and collaboration among the skills employers prioritise. Why it matters: candidates should pair practical technical ability with communication and teamwork; learning a tool in isolation is less compelling than showing how it improves a real workflow.',
  'ManpowerGroup / Experis',
  'https://investor.manpowergroup.com/news-releases/news-release-details/global-tech-hiring-steadies-skills-take-priority',
  '2026-09-15T16:24:00Z',
  5,
  'worth_watching',
  false,
  'published'
),
(
  'nptel-iit-iisc-free-learning-catalog-2026',
  'Learning',
  'LEARNING RESOURCE',
  'NPTEL opens IIT and IISc course learning to everyone',
  'NPTEL provides open access to courses from IITs and IISc. Learners can study course material for free and choose an optional proctored examination for certification. Its 2026 catalogue includes subjects spanning Python for Data Science, cloud computing, programming and cybersecurity. Why it matters: this is a credible, low-cost route to build structured technical foundations; choose a course with a defined syllabus and complete its assignments rather than collecting certificates.',
  'NPTEL',
  'https://www.nptel.ac.in/',
  '2026-11-10T00:00:00Z',
  6,
  'explainer',
  false,
  'published'
)
on conflict (slug) do update set
  category = excluded.category,
  eyebrow = excluded.eyebrow,
  title = excluded.title,
  summary = excluded.summary,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  published_at = excluded.published_at,
  reading_time_minutes = excluded.reading_time_minutes,
  signal_level = excluded.signal_level,
  is_featured = excluded.is_featured,
  status = excluded.status,
  updated_at = now();
