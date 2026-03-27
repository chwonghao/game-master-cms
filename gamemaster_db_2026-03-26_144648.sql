--
-- PostgreSQL database dump
--

\restrict Ci2QkoMPjYlaniFoondLMrH0ZwLXaOR5BpNiw4RueAmTDfZIDyKTJaYcBbIDCsZ

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: GameStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."GameStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'ARCHIVED'
);


ALTER TYPE public."GameStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'EDITOR',
    'ANALYST'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Analytics" (
    id text NOT NULL,
    "gameId" integer NOT NULL,
    "eventType" text NOT NULL,
    data jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Analytics" OWNER TO postgres;

--
-- Name: Game; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Game" (
    id integer NOT NULL,
    title text NOT NULL,
    genre text NOT NULL,
    status public."GameStatus" DEFAULT 'DRAFT'::public."GameStatus" NOT NULL,
    settings jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    "gameId" integer NOT NULL,
    "levelNumber" integer NOT NULL,
    config jsonb NOT NULL,
    settings jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    email text NOT NULL,
    password text NOT NULL,
    role public."UserRole" DEFAULT 'ADMIN'::public."UserRole" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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

COPY public."Analytics" (id, "gameId", "eventType", data, "createdAt") FROM stdin;
\.


--
-- Data for Name: Game; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Game" (id, title, genre, status, settings, "createdAt", "updatedAt") FROM stdin;
1	Cozy Tailor Shop	Puzzle	ACTIVE	{"tools": {"max_undo_per_day": 10, "daily_gift_enabled": true}, "monetization": {"enable_rewarded": true, "interstitial_cooldown": 45}}	2026-03-25 16:35:38.286	2026-03-25 16:35:38.286
\.


--
-- Data for Name: Level; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Level" (id, "gameId", "levelNumber", config, settings, "createdAt", "updatedAt") FROM stdin;
14	1	3	{"tubes": [{"wools": [0]}, {"wools": [1]}, {"wools": [1, 0, 1]}, {"wools": [0, 1, 0]}]}	{"undoLimit": 5, "difficulty": "Easy", "tubeCapacity": 4, "heuristicScore": 60}	2026-03-26 02:07:55.43	2026-03-26 02:07:55.43
15	1	4	{"tubes": [{"wools": [2, 0, 0, 2]}, {"wools": [1, 0, 1, 0]}, {"wools": []}, {"wools": [1, 2, 2]}, {"wools": [1]}]}	{"undoLimit": 5, "difficulty": "Medium", "tubeCapacity": 4, "heuristicScore": 80}	2026-03-26 02:07:55.437	2026-03-26 02:07:55.437
13	1	2	{"tubes": [{"wools": []}, {"wools": [1, 1, 0, 0]}, {"wools": []}, {"wools": [0, 1, 0, 1]}]}	{"undoLimit": 5, "difficulty": "Easy", "tubeCapacity": 4, "heuristicScore": 40}	2026-03-26 02:07:55.424	2026-03-26 02:07:55.424
16	1	5	{"tubes": [{"wools": [1, 0, 1]}, {"wools": [1, 0]}, {"wools": [2, 2]}, {"wools": [2, 1, 0, 0]}, {"wools": [2]}]}	{"undoLimit": 5, "difficulty": "Medium", "tubeCapacity": 4, "heuristicScore": 100}	2026-03-26 02:07:55.444	2026-03-26 02:07:55.444
17	1	6	{"tubes": [{"wools": [0, 2]}, {"wools": [2, 1, 1, 1]}, {"wools": [0]}, {"wools": [0]}, {"wools": [1, 2, 0, 2]}]}	{"undoLimit": 5, "difficulty": "Medium", "tubeCapacity": 4, "heuristicScore": 120}	2026-03-26 02:07:55.45	2026-03-26 02:07:55.45
18	1	7	{"tubes": [{"wools": [0, 0]}, {"wools": [2, 3, 2, 1]}, {"wools": [0, 1, 3]}, {"wools": []}, {"wools": [3, 2, 2]}, {"wools": [3, 0, 1, 1]}]}	{"undoLimit": 5, "difficulty": "Medium", "tubeCapacity": 4, "heuristicScore": 140}	2026-03-26 02:07:55.46	2026-03-26 02:07:55.46
19	1	8	{"tubes": [{"wools": [1]}, {"wools": [0]}, {"wools": [2, 0, 0]}, {"wools": [3, 3, 2]}, {"wools": [1, 3, 0, 2]}, {"wools": [1, 2, 3, 1]}]}	{"undoLimit": 5, "difficulty": "Hard", "tubeCapacity": 4, "heuristicScore": 160}	2026-03-26 02:07:55.467	2026-03-26 02:07:55.467
20	1	9	{"tubes": [{"wools": [0, 0]}, {"wools": [1, 1, 2]}, {"wools": [2, 1]}, {"wools": [2, 1, 3]}, {"wools": [0, 0]}, {"wools": [3, 2, 3, 3]}]}	{"undoLimit": 5, "difficulty": "Hard", "tubeCapacity": 4, "heuristicScore": 180}	2026-03-26 02:07:55.473	2026-03-26 02:07:55.473
21	1	10	{"tubes": [{"wools": [0, 4, 3, 2]}, {"wools": [0, 3]}, {"wools": [2, 1, 2, 1]}, {"wools": [1, 0, 1]}, {"wools": [4, 4]}, {"wools": [3, 4]}, {"wools": [0, 2, 3]}]}	{"undoLimit": 5, "difficulty": "Hard", "tubeCapacity": 4, "heuristicScore": 200}	2026-03-26 02:07:55.479	2026-03-26 02:07:55.479
12	1	1	{"tubes": [{"wools": [0, 0, 1, 1]}, {"wools": [2, 2, 0]}, {"wools": [2, 1]}, {"wools": [2, 0, 1]}, {"wools": []}]}	{"undoLimit": 5, "difficulty": "Hard", "tubeCapacity": 5, "heuristicScore": 86}	2026-03-26 02:07:55.414	2026-03-26 07:45:43.477
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, role, "createdAt", "updatedAt") FROM stdin;
1	admin@gamemaster.com	$2b$10$SbvzcTimV9cXVk6GHHb0rOuBmTJxKCl6AGmJ9lA1OW.F6QsJy10Eu	ADMIN	2026-03-25 16:35:38.182	2026-03-25 16:35:38.182
\.


--
-- Name: Game_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Game_id_seq"', 1, true);


--
-- Name: Level_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Level_id_seq"', 21, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, true);


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
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Analytics_eventType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Analytics_eventType_idx" ON public."Analytics" USING btree ("eventType");


--
-- Name: Analytics_gameId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Analytics_gameId_idx" ON public."Analytics" USING btree ("gameId");


--
-- Name: Level_gameId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Level_gameId_idx" ON public."Level" USING btree ("gameId");


--
-- Name: Level_gameId_levelNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Level_gameId_levelNumber_key" ON public."Level" USING btree ("gameId", "levelNumber");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Analytics Analytics_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Analytics"
    ADD CONSTRAINT "Analytics_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Level Level_gameId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Level"
    ADD CONSTRAINT "Level_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES public."Game"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Ci2QkoMPjYlaniFoondLMrH0ZwLXaOR5BpNiw4RueAmTDfZIDyKTJaYcBbIDCsZ

