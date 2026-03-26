--
-- PostgreSQL database dump
--

\restrict Ji2hKbq6Dd2Q2kQhgLGMWKjQ1AgcrUJP23mM0e5e6vthHSTVyjgb5fQiwfO3vKU

-- Dumped from database version 15.17 (Ubuntu 15.17-1.pgdg22.04+1)
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: GameStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."GameStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


ALTER TYPE public."GameStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'EDITOR',
    'VIEWER'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Analytics" (
    id integer NOT NULL,
    game_id integer NOT NULL,
    event_type character varying(100) NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Analytics" OWNER TO postgres;

--
-- Name: Analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Analytics_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Analytics_id_seq" OWNER TO postgres;

--
-- Name: Analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Analytics_id_seq" OWNED BY public."Analytics".id;


--
-- Name: Game; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Game" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    genre character varying(100) NOT NULL,
    status public."GameStatus" DEFAULT 'DRAFT'::public."GameStatus" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    settings jsonb
);


ALTER TABLE public."Game" OWNER TO postgres;

--
-- Name: Game_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Game_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Game_id_seq" OWNER TO postgres;

--
-- Name: Game_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Game_id_seq" OWNED BY public."Game".id;


--
-- Name: Level; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Level" (
    id integer NOT NULL,
    game_id integer NOT NULL,
    level_number integer NOT NULL,
    config jsonb NOT NULL,
    settings jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Level" OWNER TO postgres;

--
-- Name: Level_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Level_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Level_id_seq" OWNER TO postgres;

--
-- Name: Level_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Level_id_seq" OWNED BY public."Level".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    role public."UserRole" DEFAULT 'EDITOR'::public."UserRole" NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: Analytics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Analytics" ALTER COLUMN id SET DEFAULT nextval('public."Analytics_id_seq"'::regclass);


--
-- Name: Game id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Game" ALTER COLUMN id SET DEFAULT nextval('public."Game_id_seq"'::regclass);


--
-- Name: Level id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Level" ALTER COLUMN id SET DEFAULT nextval('public."Level_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Analytics" (id, game_id, event_type, data, created_at) FROM stdin;
6	1	LEVEL_START	{"player_id": "p_123", "level_number": 1}	2026-03-23 22:33:45.407455
7	1	LEVEL_COMPLETE	{"moves": 4, "level_number": 1, "time_spent_seconds": 15}	2026-03-23 22:33:45.407455
8	1	LEVEL_START	{"player_id": "p_123", "level_number": 2}	2026-03-24 22:33:45.407455
9	1	LEVEL_FAIL	{"reason": "out_of_moves", "drop_off": true, "level_number": 2}	2026-03-24 22:33:45.407455
10	1	LEVEL_FAIL	{"reason": "quit", "drop_off": true, "level_number": 3}	2026-03-25 22:33:45.407455
\.


--
-- Data for Name: Game; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Game" (id, title, genre, status, created_at, settings) FROM stdin;
1	Cozy Tailor Shop	Puzzle	PUBLISHED	2026-03-25 22:33:40.340463	{"tools": {"max_undo_per_day": 10, "daily_gift_enabled": true}, "monetization": {"enable_rewarded": true, "interstitial_cooldown": 45}}
2	Space Defender	Action RPG	DRAFT	2026-03-25 22:33:40.340463	{"tools": {"daily_gift_enabled": false}, "monetization": {"enable_rewarded": false, "interstitial_cooldown": 60}}
\.


--
-- Data for Name: Level; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Level" (id, game_id, level_number, config, settings, created_at) FROM stdin;
4	1	1	{"tubes": [{"wools": [0, 1]}, {"wools": [1, 0]}, {"wools": []}]}	{"difficulty": "Easy", "undo_limit": 5, "tube_capacity": 4, "heuristic_score": 15}	2026-03-25 22:33:43.75367
5	1	2	{"tubes": [{"wools": [0, 2, 0, 2]}, {"wools": [2, 0, 2, 0]}, {"wools": []}]}	{"difficulty": "Medium", "undo_limit": 3, "tube_capacity": 4, "heuristic_score": 45}	2026-03-25 22:33:43.75367
6	1	3	{"tubes": [{"wools": [1, 2, 3, 4]}, {"wools": [4, 3, 2, 1]}, {"wools": [1, 2, 1, 2]}, {"wools": []}, {"wools": []}]}	{"difficulty": "Hard", "undo_limit": 2, "tube_capacity": 4, "heuristic_score": 120}	2026-03-25 22:33:43.75367
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, role, created_at) FROM stdin;
1	hao.nguyen@gamemaster.com	ADMIN	2026-03-25 22:32:11.911208
2	level.designer@gamemaster.com	EDITOR	2026-03-25 22:32:11.911208
\.


--
-- Name: Analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Analytics_id_seq"', 10, true);


--
-- Name: Game_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Game_id_seq"', 2, true);


--
-- Name: Level_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Level_id_seq"', 6, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 2, true);


--
-- Name: Analytics Analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Analytics"
    ADD CONSTRAINT "Analytics_pkey" PRIMARY KEY (id);


--
-- Name: Game Game_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Game"
    ADD CONSTRAINT "Game_pkey" PRIMARY KEY (id);


--
-- Name: Level Level_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Level"
    ADD CONSTRAINT "Level_pkey" PRIMARY KEY (id);


--
-- Name: User User_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Level unique_level_per_game; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Level"
    ADD CONSTRAINT unique_level_per_game UNIQUE (game_id, level_number);


--
-- Name: Analytics fk_analytics_game; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Analytics"
    ADD CONSTRAINT fk_analytics_game FOREIGN KEY (game_id) REFERENCES public."Game"(id) ON DELETE CASCADE;


--
-- Name: Level fk_game; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Level"
    ADD CONSTRAINT fk_game FOREIGN KEY (game_id) REFERENCES public."Game"(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Ji2hKbq6Dd2Q2kQhgLGMWKjQ1AgcrUJP23mM0e5e6vthHSTVyjgb5fQiwfO3vKU

