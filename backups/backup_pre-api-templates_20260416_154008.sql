--
-- PostgreSQL database dump
--

\restrict wmBcr3ptp53zhvFJJI2Sdc0zyWIy9xJCqGAJDeIA5L6LnlS2VdnkBaTaO54Mpnz

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: alerttype; Type: TYPE; Schema: public; Owner: darkweb
--

CREATE TYPE public.alerttype AS ENUM (
    'GUI',
    'WEBHOOK',
    'EMAIL',
    'DISCORD'
);


ALTER TYPE public.alerttype OWNER TO darkweb;

--
-- Name: feedtype; Type: TYPE; Schema: public; Owner: darkweb
--

CREATE TYPE public.feedtype AS ENUM (
    'WEBSITE',
    'ONION',
    'RSS',
    'TELEGRAM'
);


ALTER TYPE public.feedtype OWNER TO darkweb;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: darkweb
--

CREATE TABLE public.alerts (
    id integer NOT NULL,
    feed_id integer NOT NULL,
    keyword_id integer NOT NULL,
    matched_content text NOT NULL,
    context text,
    triggered_at timestamp with time zone DEFAULT now(),
    read boolean,
    criticality character varying(20) DEFAULT 'medium'::character varying NOT NULL
);


ALTER TABLE public.alerts OWNER TO darkweb;

--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: darkweb
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.alerts_id_seq OWNER TO darkweb;

--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: darkweb
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: feed_keywords; Type: TABLE; Schema: public; Owner: darkweb
--

CREATE TABLE public.feed_keywords (
    feed_id integer,
    keyword_id integer
);


ALTER TABLE public.feed_keywords OWNER TO darkweb;

--
-- Name: feeds; Type: TABLE; Schema: public; Owner: darkweb
--

CREATE TABLE public.feeds (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    feed_type public.feedtype NOT NULL,
    url text NOT NULL,
    enabled boolean,
    fetch_interval integer,
    last_fetched timestamp with time zone,
    last_content_hash character varying(64),
    feed_metadata json,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    last_error text,
    last_error_at timestamp with time zone,
    consecutive_failures integer DEFAULT 0
);


ALTER TABLE public.feeds OWNER TO darkweb;

--
-- Name: feeds_id_seq; Type: SEQUENCE; Schema: public; Owner: darkweb
--

CREATE SEQUENCE public.feeds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.feeds_id_seq OWNER TO darkweb;

--
-- Name: feeds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: darkweb
--

ALTER SEQUENCE public.feeds_id_seq OWNED BY public.feeds.id;


--
-- Name: keywords; Type: TABLE; Schema: public; Owner: darkweb
--

CREATE TABLE public.keywords (
    id integer NOT NULL,
    keyword character varying(255) NOT NULL,
    case_sensitive boolean,
    regex_pattern boolean,
    enabled boolean,
    created_at timestamp with time zone DEFAULT now(),
    criticality character varying(20) DEFAULT 'medium'::character varying NOT NULL
);


ALTER TABLE public.keywords OWNER TO darkweb;

--
-- Name: keywords_id_seq; Type: SEQUENCE; Schema: public; Owner: darkweb
--

CREATE SEQUENCE public.keywords_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.keywords_id_seq OWNER TO darkweb;

--
-- Name: keywords_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: darkweb
--

ALTER SEQUENCE public.keywords_id_seq OWNED BY public.keywords.id;


--
-- Name: notification_configs; Type: TABLE; Schema: public; Owner: darkweb
--

CREATE TABLE public.notification_configs (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    notification_type public.alerttype NOT NULL,
    destination text NOT NULL,
    enabled boolean,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notification_configs OWNER TO darkweb;

--
-- Name: notification_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: darkweb
--

CREATE SEQUENCE public.notification_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notification_configs_id_seq OWNER TO darkweb;

--
-- Name: notification_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: darkweb
--

ALTER SEQUENCE public.notification_configs_id_seq OWNED BY public.notification_configs.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: darkweb
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    alert_id integer NOT NULL,
    notification_type public.alerttype NOT NULL,
    destination text NOT NULL,
    sent boolean,
    sent_at timestamp with time zone,
    error text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO darkweb;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: darkweb
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notifications_id_seq OWNER TO darkweb;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: darkweb
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: feeds id; Type: DEFAULT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.feeds ALTER COLUMN id SET DEFAULT nextval('public.feeds_id_seq'::regclass);


--
-- Name: keywords id; Type: DEFAULT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.keywords ALTER COLUMN id SET DEFAULT nextval('public.keywords_id_seq'::regclass);


--
-- Name: notification_configs id; Type: DEFAULT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.notification_configs ALTER COLUMN id SET DEFAULT nextval('public.notification_configs_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: darkweb
--

COPY public.alerts (id, feed_id, keyword_id, matched_content, context, triggered_at, read, criticality) FROM stdin;
36	19	16	SPA	[{"id":31422,"date":"2026-04-15 14:51:43","victim":"Gruppo ICM SPA","gang":"qilin","hash":"00c98725610990c3168f25b07a64f6a81684c395abc13044428ab29627ac1898","country":"Italy","website":"","description":"Construction","city":"","region":"","dataset_pub":"","victim_no...	2026-04-16 12:34:26.47533+00	f	critical
37	18	15	SEKISUI	...bat Reader Prototype Pollution Zero-Day Enables Code Execution via Malicious PDFs , and Dark Web Informer April 13, 2026 Paid Members Public Data Breaches Threat Actor Selling 70GB of ITAR-Controlled SEKISUI Aerospace Technical Data Including Boeing 737/787 Tooling, STEP Files, and Military Program Schematics for $200,000 , and Dark Web Informer April 13, 2026 Paid Members Public Data Breaches Moroccan B...	2026-04-16 12:34:50.517897+00	f	high
38	18	16	spa	...rototype Pollution Zero-Day Enables Code Execution via Malicious PDFs , and Dark Web Informer April 13, 2026 Paid Members Public Data Breaches Threat Actor Selling 70GB of ITAR-Controlled SEKISUI Aerospace Technical Data Including Boeing 737/787 Tooling, STEP Files, and Military Program Schematics for $200,000 , and Dark Web Informer April 13, 2026 Paid Members Public Data Breaches Moroccan Biomedica...	2026-04-16 12:34:50.523442+00	f	critical
39	6	16	spa	... agencies assess a group of Iranian-affiliated advanced persistent threat (APT) actors is conducting this activity to cause disruptive effects within the United States. The group has targeted devices spanning multiple U.S. critical infrastructure sectors, including <a href="https://www.cisa.gov/topics/critical-infrastructure-security-and-resilience/critical-infrastructure-sectors/government-services-...	2026-04-16 12:49:37.895244+00	f	critical
40	3	16	spa	... "screenshots/payload/TFE Group.png", "group_name": "payload"}, {"post_title": "Empower Group", "discovered": "2026-04-16 13:53:32.811266", "description": "Empower Group has positioned itself in this space as a hub for it's clients to access these different types of funding products. Empower Group has leveraged par...", "link": null, "magnet": null, "screen": null, "group_name": "dragonforce"}, {"pos...	2026-04-16 13:05:37.931559+00	f	critical
41	14	16	SPA	... Company url Zoom Info Apr 15, 2026 4 photos 60395 files 84.00 GB Time till publication: 225h : 38m Learn More Limkon Food & Beverage Company url Zoom Info Apr 15, 2026 0 photos Learn More Gruppo ICM SPA Construction Company url Zoom Info Apr 15, 2026 6 photos 187400 files 402.00 GB Learn More Basalt Dentistry Healthcare Services Company url Zoom Info Apr 13, 2026 0 photos Learn More Frutcola Olmué A...	2026-04-16 13:21:39.806371+00	f	critical
42	15	16	spa	...024,   12:19 UTC 59765 vinatiorganics.com published Vinati Organics Limited (VOL) is one of the largest manufacturers of specialty chemical and organic intermediaries with a sustained market presence spanning over 35 countries in the world. Updated: 11 Aug, 2024,   12:17 UTC 59056 vikrantsprings.com published Vikrant Springs is a leading manufacturer and exporter of custom made MULTI-LEAF and PARABOL...	2026-04-16 13:23:42.122665+00	f	critical
43	16	16	spa	...ic registration, build your own RaaS team in 1 hourwww.goempowergroup.comEmpower Groupwww.goempowergroup.com3718 Northern Blvd Ste 409, Long Island316.38 GBEmpower Group has positioned itself in this space as a hub for it's clients to access these different types of funding products. Empower Group has leveraged par...Publication: 1 days 21:17:02 15 April 2026Openwww.bela-pharm.combela - pharmwww.bela...	2026-04-16 13:24:41.494796+00	f	critical
44	7	16	Spa	...mpaign, which has been Mirax Android RAT Turns Devices into SOCKS5 Proxies, Reaching 220,000 via Meta Ads A nascent Android remote access trojan&nbsp;called Mirax has been observed actively targeting Spanish-speaking countries, with campaigns reaching more than 220,000 accounts on Facebook, Instagram, Messenger, and Threads through advertisements on&nbsp;Meta.\n"Mirax integrates advanced Remote Access...	2026-04-16 13:33:37.805435+00	f	critical
\.


--
-- Data for Name: feed_keywords; Type: TABLE DATA; Schema: public; Owner: darkweb
--

COPY public.feed_keywords (feed_id, keyword_id) FROM stdin;
\.


--
-- Data for Name: feeds; Type: TABLE DATA; Schema: public; Owner: darkweb
--

COPY public.feeds (id, name, feed_type, url, enabled, fetch_interval, last_fetched, last_content_hash, feed_metadata, created_at, updated_at, last_error, last_error_at, consecutive_failures) FROM stdin;
3	RansomLook API Recent	WEBSITE	https://www.ransomlook.io/api/recent	t	3600	2026-04-16 13:05:37.92308+00	f1cfca5989465f9035754885fced54033e8aa51f2a708f92b221d311e141f63a	{}	2026-04-16 07:00:38.255213+00	2026-04-16 13:05:37.946879+00	\N	\N	0
19	Ransomfeed.it	WEBSITE	https://api.ransomfeed.it/	t	3600	2026-04-16 13:34:37.692051+00	448ff5be4e6541577fe10fd9273ecf65c1a4e54d0506b400ea7ea978428b81be	{}	2026-04-16 12:34:01.366769+00	2026-04-16 13:34:37.473424+00	\N	\N	0
13	Coinbasecartel	ONION	http://fjg4zi4opkxkvdz7mvwp7h6goe4tcby3hhkrz43pht4j3vakhy75znyd.onion	t	3600	2026-04-16 13:07:40.772416+00	109683aee62d1d4bd2892b289d2c3f4ee7205a2e22e3bc4f657922cfc5809e80	{}	2026-04-16 08:19:06.732794+00	2026-04-16 13:07:40.777575+00	\N	\N	0
12	ShadowByt3$ LEAKS	ONION	http://sdwbytqeb664krp2wz2qs3lxxah2rhneuotot5hy7g4jpn2pindigcad.onion/leaks.php	t	3600	2026-04-16 13:09:20.288462+00	66d1fe2eb65cfe455ca097fe3103d719d714a8a0b2cc2e0101d8c905fa66cedc	{}	2026-04-16 07:40:48.657765+00	2026-04-16 13:09:20.292155+00	\N	\N	0
9	Dark Reading	RSS	https://www.darkreading.com/rss.xml	t	3600	2026-04-16 13:34:37.905151+00	38d61934ff06b00fc5fb7e0477c06f45321df25d17b65539e6890e1674532e59	{}	2026-04-16 07:28:35.063303+00	2026-04-16 13:34:37.910957+00	\N	\N	0
18	DarkWebInformer	WEBSITE	https://darkwebinformer.com/	t	3600	2026-04-16 13:35:37.688051+00	4ddef83736a2dfa6d89187e7d5872fb5e5ce89de5aef308c39e0f0d1469ac99d	{}	2026-04-16 12:31:32.300189+00	2026-04-16 13:35:37.469748+00	\N	\N	0
4	Krebs on Security	RSS	https://krebsonsecurity.com/feed/	t	7200	2026-04-16 13:38:37.691184+00	cbab51d7a02c3623d3fc0f832c766cad6e8c24b0df9b481af4629765b3187e5b	{}	2026-04-16 07:28:35.063303+00	2026-04-16 13:38:37.694628+00	\N	\N	0
14	Qilin	ONION	http://ijzn3sicrcy7guixkzjkib4ukbiilwc3xhnmby4mcbccnsd7j2rekvqd.onion/	t	3600	2026-04-16 13:21:39.802506+00	59af61bb237c9a767a46cf0f3eee05de2cd2f06f26881f8f5105853781eb3508	{}	2026-04-16 09:17:18.218147+00	2026-04-16 13:21:39.812427+00	\N	\N	0
15	LockBit	ONION	http://lockbit3753ekiocyo5epmpy6klmejchjtzddoekjlnt6mu3qh4de2id.onion/	t	3600	2026-04-16 13:23:42.112799+00	22c0f819338c971ef1e58a16b6e5ebaebd39fdf8b394aa2f096964381cbf952b	{}	2026-04-16 09:18:54.164671+00	2026-04-16 13:23:42.129044+00	\N	\N	0
16	DragonForce	ONION	http://z3wqggtxft7id3ibr7srivv5gjof5fwg76slewnzwwakjuf3nlhukdid.onion/blog	t	3600	2026-04-16 13:24:41.490363+00	505221f6c6154ff73fc939daeacaaa1cc2e305a59714e84c7a8e4a08846f85b6	{}	2026-04-16 09:19:51.07215+00	2026-04-16 13:24:41.501422+00	\N	\N	0
10	Security Affairs	RSS	https://securityaffairs.com/feed	t	7200	2026-04-16 13:30:37.680359+00	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855	{}	2026-04-16 07:28:35.063303+00	2026-04-16 13:30:37.686393+00	\N	\N	0
5	Bleeping Computer Security	RSS	https://www.bleepingcomputer.com/feed/	t	3600	2026-04-16 13:33:37.620454+00	616e702e569c794d35260ac448b722d1b5cd64d82dc36c00169424ce95e2d24b	{}	2026-04-16 07:28:35.063303+00	2026-04-16 13:33:37.624242+00	\N	\N	0
7	The Hacker News	RSS	https://feeds.feedburner.com/TheHackersNews	t	3600	2026-04-16 13:33:37.800005+00	cb807b4ea015e4d234e79fa2b92477d143cfa783c887287d3f8d9e1bd4a1da1f	{}	2026-04-16 07:28:35.063303+00	2026-04-16 13:33:37.812141+00	\N	\N	0
6	CISA Advisories	RSS	https://www.cisa.gov/cybersecurity-advisories/all.xml	t	3600	2026-04-16 12:49:37.879606+00	1da913d226f5c1590153e4c44ddc30d7ae3c62c967fbc5c02b3cb50ee91b88a2	{}	2026-04-16 07:28:35.063303+00	2026-04-16 12:49:37.908975+00	\N	\N	0
17	LuemmelSec Twitter	RSS	https://nitter.net/theluemmel/rss	t	3600	2026-04-16 12:50:38.267071+00	bf83e331562c30f0add4be648e035170fd23d5819ac2c375c35cf73665359ce2	{}	2026-04-16 11:39:48.865998+00	2026-04-16 12:50:38.271652+00	\N	\N	0
2	HIBP Breach Feed	RSS	https://haveibeenpwned.com/feed/breaches	t	3600	2026-04-16 13:05:37.589318+00	e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855	{}	2026-04-16 06:59:07.51096+00	2026-04-16 13:05:37.593276+00	\N	\N	0
8	Threat Post	RSS	https://threatpost.com/feed/	t	3600	2026-04-16 13:33:37.868265+00	36dbfebc5e744142e9d7c7519cbc5a19b44a399423b06e9055207436aab44ce0	{}	2026-04-16 07:28:35.063303+00	2026-04-16 13:33:37.872371+00	\N	\N	0
\.


--
-- Data for Name: keywords; Type: TABLE DATA; Schema: public; Owner: darkweb
--

COPY public.keywords (id, keyword, case_sensitive, regex_pattern, enabled, created_at, criticality) FROM stdin;
15	SEKISUI	f	f	t	2026-04-16 12:31:52.630672+00	high
16	SPA	f	f	t	2026-04-16 12:34:11.660296+00	critical
\.


--
-- Data for Name: notification_configs; Type: TABLE DATA; Schema: public; Owner: darkweb
--

COPY public.notification_configs (id, name, notification_type, destination, enabled, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: darkweb
--

COPY public.notifications (id, alert_id, notification_type, destination, sent, sent_at, error, created_at) FROM stdin;
\.


--
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: darkweb
--

SELECT pg_catalog.setval('public.alerts_id_seq', 44, true);


--
-- Name: feeds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: darkweb
--

SELECT pg_catalog.setval('public.feeds_id_seq', 19, true);


--
-- Name: keywords_id_seq; Type: SEQUENCE SET; Schema: public; Owner: darkweb
--

SELECT pg_catalog.setval('public.keywords_id_seq', 16, true);


--
-- Name: notification_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: darkweb
--

SELECT pg_catalog.setval('public.notification_configs_id_seq', 1, false);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: darkweb
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: feeds feeds_pkey; Type: CONSTRAINT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.feeds
    ADD CONSTRAINT feeds_pkey PRIMARY KEY (id);


--
-- Name: keywords keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.keywords
    ADD CONSTRAINT keywords_pkey PRIMARY KEY (id);


--
-- Name: notification_configs notification_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.notification_configs
    ADD CONSTRAINT notification_configs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: ix_alerts_id; Type: INDEX; Schema: public; Owner: darkweb
--

CREATE INDEX ix_alerts_id ON public.alerts USING btree (id);


--
-- Name: ix_feeds_id; Type: INDEX; Schema: public; Owner: darkweb
--

CREATE INDEX ix_feeds_id ON public.feeds USING btree (id);


--
-- Name: ix_keywords_id; Type: INDEX; Schema: public; Owner: darkweb
--

CREATE INDEX ix_keywords_id ON public.keywords USING btree (id);


--
-- Name: ix_keywords_keyword; Type: INDEX; Schema: public; Owner: darkweb
--

CREATE UNIQUE INDEX ix_keywords_keyword ON public.keywords USING btree (keyword);


--
-- Name: ix_notification_configs_id; Type: INDEX; Schema: public; Owner: darkweb
--

CREATE INDEX ix_notification_configs_id ON public.notification_configs USING btree (id);


--
-- Name: ix_notifications_id; Type: INDEX; Schema: public; Owner: darkweb
--

CREATE INDEX ix_notifications_id ON public.notifications USING btree (id);


--
-- Name: alerts alerts_feed_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_feed_id_fkey FOREIGN KEY (feed_id) REFERENCES public.feeds(id) ON DELETE CASCADE;


--
-- Name: alerts alerts_keyword_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_keyword_id_fkey FOREIGN KEY (keyword_id) REFERENCES public.keywords(id) ON DELETE CASCADE;


--
-- Name: feed_keywords feed_keywords_feed_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.feed_keywords
    ADD CONSTRAINT feed_keywords_feed_id_fkey FOREIGN KEY (feed_id) REFERENCES public.feeds(id) ON DELETE CASCADE;


--
-- Name: feed_keywords feed_keywords_keyword_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.feed_keywords
    ADD CONSTRAINT feed_keywords_keyword_id_fkey FOREIGN KEY (keyword_id) REFERENCES public.keywords(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: darkweb
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict wmBcr3ptp53zhvFJJI2Sdc0zyWIy9xJCqGAJDeIA5L6LnlS2VdnkBaTaO54Mpnz

