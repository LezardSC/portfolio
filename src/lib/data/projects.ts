import { visibleProjects, type Project } from '$lib/projects';
import { typeset } from '$lib/i18n/typography';

// French text may use plain spaces and straight apostrophes: typeset() adds the no-break spaces and ’
// (docs/content-guide.md). Always give typeset its type, typeset<X[]>(…): it keeps TypeScript's check
// of misspelled field names.

const gh = (repo: string) => `https://github.com/LezardSC/${repo}`;

/**
 * Priority order: these projects come first, in this order; every other project follows, newest
 * first. Not a separate category: the first 6 of whatever list is displayed (filters included)
 * get the big cards (the first 5 on phones). Move a line to reorder. Every id must exist and not
 * be hidden (a test checks it).
 */
export const PRIORITY: string[] = [];

/** Every project, hidden ones included. Order here doesn't matter: the page sorts them. */
export const ALL_PROJECTS = typeset<Project[]>([
	{
		id: 'cross-emu',
		title: 'Cross-Emu',
		description: {
			en: 'A Game Boy and Game Boy Color emulator in Rust, built as a team: cycle-accurate CPU and graphics, sound, cartridge support, save states and a built-in debugger. Started as a school project, we kept going to make it truly faithful and enjoyable to use.',
			fr: "Un émulateur Game Boy et Game Boy Color en Rust, développé en équipe : CPU et affichage précis au cycle près, gestion du son et des cartouches, sauvegardes d'état et débogueur intégré. Parti d'un projet d'école, on l'a poursuivi pour le rendre vraiment fidèle et agréable à utiliser."
		},
		summary: {
			en: 'A cycle-accurate Game Boy and Game Boy Color emulator in Rust, with a debugger.',
			fr: 'Un émulateur Game Boy et Game Boy Color en Rust, précis et fidèle à l’originale, avec débogueur.'
		},
		date: '2026-05',
		context: 'personal',
		domains: ['low-level', 'games'],
		tech: ['Rust', 'assembly', 'egui', 'cpal', 'tokio'],
		links: { repo: 'https://github.com/cross-emu/cross-emu' },
		media: {
			kind: 'video',
			src: 'projects/cross-emu/demo.mp4',
			poster: 'projects/cross-emu/poster.webp',
			phone: 'projects/cross-emu/phone.webp'
		}
	},
	{
		id: 'kayp-pbw-2024',
		title: 'KAYP',
		description: {
			en: 'Digitalizes maritime trade documents, starting with the bill of lading. The backend exposes DCSA-standard APIs that serialize, encrypt and hash each eBL, then anchor it on the XRP Ledger through smart contracts.',
			fr: 'Numérise les documents du commerce maritime, à commencer par le connaissement. Le backend expose des API au standard DCSA qui sérialisent, chiffrent et hachent chaque eBL, puis l’ancrent sur le XRP Ledger via des smart contracts.'
		},
		summary: {
			en: 'Maritime bills of lading as electronic documents, encrypted and anchored on the XRP Ledger.',
			fr: 'Des connaissements maritimes électroniques, chiffrés et ancrés sur le XRP Ledger.'
		},
		date: '2024-04',
		context: 'hackathon',
		domains: ['blockchain', 'web'],
		tech: ['Java', 'Spring Boot', 'Python', 'XRPL'],
		links: { repo: gh('KAYP-backend-PBW2024') },
		award: {
			en: 'Winner - Paris Blockchain Week 2024 (XRPL track)',
			fr: 'Vainqueur - Paris Blockchain Week 2024 (track XRPL)'
		},
		hidden: true
	},
	{
		id: 'kayp-h-web3-paris',
		title: 'KAYP - H-W3B Paris',
		description: {
			en: 'First version of KAYP, built in a weekend: a web app to generate, exchange and store maritime bills of lading, secured and audited on the blockchain.',
			fr: 'Première version de KAYP, construite en un week-end\u00a0: une application web pour générer, échanger et stocker des connaissements maritimes, sécurisés et audités sur la blockchain.'
		},
		summary: {
			en: 'The weekend prototype of KAYP: bills of lading secured on the blockchain.',
			fr: 'Le prototype de KAYP, en un week-end\u00a0: des connaissements sécurisés sur la blockchain.'
		},
		date: '2024-03',
		context: 'hackathon',
		domains: ['blockchain', 'web'],
		tech: ['TypeScript', 'React', 'Tailwind CSS', 'Python'],
		links: { repo: gh('KAYP-H-WEB3PARIS') },
		award: { en: 'Winner - H-W3B Paris 2024', fr: 'Vainqueur - H-W3B Paris 2024' },
		hidden: true
	},
	{
		id: 'ft-transcendence',
		title: 'Transcendence',
		description: {
			en: 'Final project of the 42 Common Core: a website for online multiplayer Pong with tournaments, e-mail-verified accounts, 3D rendering, an AI opponent and a blockchain module, in English, French and Spanish.',
			fr: 'Projet final du tronc commun de 42\u00a0: un site de Pong multijoueur en ligne avec tournois, comptes vérifiés par e-mail, rendu 3D, IA adverse et module blockchain, en anglais, français et espagnol.'
		},
		summary: {
			en: 'Online multiplayer Pong with tournaments, 3D rendering and an AI opponent.',
			fr: 'Un Pong multijoueur en ligne avec tournois, rendu 3D et IA adverse.'
		},
		date: '2024-08',
		context: 'school',
		domains: ['web', 'games'],
		tech: ['Python', 'JavaScript', 'Django', 'Solidity', 'Docker'],
		links: { repo: 'https://github.com/maujogue/transcendence' },
		media: {
			kind: 'video',
			src: 'projects/transcendence/demo.mp4',
			poster: 'projects/transcendence/poster.webp',
			phone: 'projects/transcendence/phone.webp'
		}
	},
	{
		id: 'microcode',
		title: 'microcode',
		description: {
			en: 'A small autonomous AI agent written from scratch in Python on top of a local Ollama model: raw API calls, tool schemas generated from docstrings, and a ReAct loop that chains web search, scraping, file reading and more.',
			fr: 'Un petit agent IA autonome écrit de zéro en Python sur un modèle Ollama local\u00a0: appels API bruts, schémas d’outils générés depuis les docstrings et boucle ReAct qui enchaîne recherche web, scraping, lecture de fichiers, etc.'
		},
		summary: {
			en: 'An AI agent written from scratch on a local Ollama model.',
			fr: 'Un agent IA écrit de zéro, sur un modèle Ollama local.'
		},
		date: '2026-05',
		context: 'personal',
		domains: ['ai'],
		tech: ['Python', 'Ollama', 'LLM agents'],
		links: { repo: gh('microcode') },
		media: {
			kind: 'video',
			src: 'projects/microcode/demo.mp4',
			poster: 'projects/microcode/poster.webp',
			phone: 'projects/microcode/phone.webp'
		}
	},
	{
		id: 'bahapad',
		title: 'Bahapad',
		description: {
			en: 'A token launchpad for the Bahamut blockchain: a factory contract lets anyone deploy a custom ERC-20 token with its metadata (name, symbol, supply, image, description).',
			fr: 'Un launchpad de tokens pour la blockchain Bahamut\u00a0: un contrat factory permet à chacun de déployer son propre token ERC-20 avec ses métadonnées (nom, symbole, offre, image, description).'
		},
		summary: {
			en: 'A launchpad to deploy your own ERC-20 token on Bahamut.',
			fr: 'Un launchpad pour déployer son propre token ERC-20 sur Bahamut.'
		},
		date: '2025-04',
		context: 'hackathon',
		domains: ['blockchain'],
		tech: ['Solidity', 'TypeScript', 'Hardhat'],
		links: { repo: gh('Bahapad-Smart-Contract-PBW2025') },
		award: {
			en: '3rd place - Paris Blockchain Week 2025',
			fr: '3e place - Paris Blockchain Week 2025'
		},
		hidden: true
	},
	{
		id: 'goldeneye-data-augmentation',
		title: 'GoldenEye - data augmentation',
		description: {
			en: 'Data augmentation experiments for GoldenEye, a SogetiLabs (Capgemini) computer-vision project, to enlarge and diversify its training datasets.',
			fr: 'Expérimentations d’augmentation de données pour GoldenEye, un projet de vision par ordinateur de SogetiLabs (Capgemini), afin d’enrichir et de diversifier ses jeux d’entraînement.'
		},
		summary: {
			en: 'Data augmentation for a SogetiLabs computer-vision project.',
			fr: 'Augmentation de données pour un projet de vision par ordinateur de SogetiLabs.'
		},
		date: '2025-07',
		context: 'professional',
		domains: ['ai'],
		tech: ['Python'],
		links: {},
		hidden: true
	},
	{
		id: 'tokenizart',
		title: 'tokenizArt',
		description: {
			en: 'Girl42, a one-of-a-kind ERC-721 NFT deployed on Ethereum’s Sepolia testnet, with its image and metadata stored on IPFS and a small website to interact with it.',
			fr: 'Girl42, un NFT ERC-721 unique déployé sur le testnet Sepolia d’Ethereum, avec image et métadonnées stockées sur IPFS et un petit site pour interagir avec lui.'
		},
		summary: {
			en: 'A one-of-a-kind ERC-721 NFT on Sepolia, with its metadata on IPFS.',
			fr: 'Un NFT ERC-721 unique sur Sepolia, avec ses métadonnées sur IPFS.'
		},
		date: '2024-12',
		context: 'school',
		domains: ['blockchain', 'web'],
		tech: ['Solidity', 'Hardhat', 'IPFS', 'JavaScript'],
		links: { repo: gh('42-tokenizArt') },
		hidden: true
	},
	{
		id: 'tokenizer',
		title: 'tokenizer',
		description: {
			en: 'Altarian42, an ERC-20 token meant to modernize 42’s wallet system: capped and burnable supply, with multisignature approval of every reward.',
			fr: 'Altarian42, un token ERC-20 pensé pour moderniser le porte-monnaie de 42\u00a0: offre plafonnée et brûlable, avec validation multisignature de chaque récompense.'
		},
		summary: {
			en: 'A multisig-approved ERC-20 token for 42’s wallet.',
			fr: 'Un token ERC-20 à validation multisignature pour le porte-monnaie de 42.'
		},
		date: '2024-06',
		context: 'school',
		domains: ['blockchain'],
		tech: ['Solidity', 'JavaScript'],
		links: { repo: gh('42-tokenizer') },
		hidden: true
	},
	{
		id: 'ft-linear-regression',
		title: 'ft_linear_regression',
		description: {
			en: 'An introduction to machine learning: a linear regression written from scratch, with gradient descent and min–max normalization, predicting a car’s price from its mileage.',
			fr: 'Une introduction au machine learning\u00a0: une régression linéaire écrite de zéro, avec descente de gradient et normalisation min–max, qui prédit le prix d’une voiture selon son kilométrage.'
		},
		summary: {
			en: 'A from-scratch linear regression that predicts a car’s price.',
			fr: 'Régression linéaire écrite de zéro qui prédit le prix d’une voiture.'
		},
		date: '2025-07',
		context: 'school',
		domains: ['ai'],
		tech: ['Python'],
		links: { repo: gh('42-ft_linear_regression') },
		media: {
			kind: 'video',
			src: 'projects/linear-regression/demo.mp4',
			poster: 'projects/linear-regression/poster.webp',
			phone: 'projects/linear-regression/phone.webp'
		}
	},
	{
		id: 'dslr',
		title: 'DSLR',
		description: {
			en: 'Data science × logistic regression, as a Hogwarts sorting hat: statistics recoded by hand, data visualization to pick features, then a one-vs-all logistic regression trained with gradient descent from scratch. Group project.',
			fr: 'Data science × régression logistique, façon Choixpeau de Poudlard\u00a0: statistiques recodées à la main, visualisation des données pour choisir les features, puis une régression logistique one-vs-all entraînée par descente de gradient, écrite de zéro. Projet de groupe.'
		},
		summary: {
			en: 'A hand-coded one-vs-all logistic regression, Hogwarts sorting hat style.',
			fr: 'Régression logistique one-vs-all recodée à la main, façon Choixpeau de Poudlard.'
		},
		date: '2025-08',
		context: 'school',
		domains: ['ai'],
		tech: ['Python', 'Matplotlib'],
		links: { repo: gh('https://github.com/Hgeffroy/42_Dslr') },
		media: {
			kind: 'video',
			src: 'projects/dslr/demo.mp4',
			poster: 'projects/dslr/poster.webp',
			phone: 'projects/dslr/phone.webp'
		}
	},
	{
		id: 'leaffliction',
		title: 'Leaffliction',
		description: {
			en: 'Leaf disease classification from photos with a convolutional neural network in PyTorch, with data augmentation to balance the dataset and PlantCV image transformations.',
			fr: 'Classification de maladies des feuilles à partir de photos avec un réseau de neurones convolutif en PyTorch, avec de l’augmentation de données pour équilibrer le dataset et des transformations d’images PlantCV.'
		},
		summary: {
			en: 'Leaf disease detection with a convolutional neural network.',
			fr: 'Détection de maladies des feuilles par un réseau de neurones convolutif.'
		},
		date: '2025-11',
		context: 'school',
		domains: ['ai'],
		tech: ['Python', 'PyTorch', 'PlantCV'],
		links: { repo: gh('42-Leaffliction') },
		media: {
			kind: 'video',
			src: 'projects/leaffliction/demo.mp4',
			poster: 'projects/leaffliction/poster.webp',
			phone: 'projects/leaffliction/phone.webp'
		}
	},
	{
		id: 'libasm',
		title: 'libasm',
		description: {
			en: 'Standard C functions (strlen, strcpy, strcmp, write, read, strdup) and linked-list helpers rewritten in x86-64 assembly with NASM, calling syscalls directly.',
			fr: 'Des fonctions C standard (strlen, strcpy, strcmp, write, read, strdup) et des utilitaires de listes chaînées réécrits en assembleur x86-64 avec NASM, en appelant directement les syscalls.'
		},
		summary: {
			en: 'Standard C functions rewritten in x86-64 assembly.',
			fr: 'Des fonctions C standard réécrites en assembleur x86-64.'
		},
		date: '2024-06',
		context: 'school',
		domains: ['low-level'],
		tech: ['x86-64 Assembly', 'NASM', 'C'],
		links: { repo: gh('42-libasm') },
		hidden: true
	},
	{
		id: 'confiture-de-jeu',
		title: 'Confiture de Jeu #1',
		description: {
			en: 'A 48-hour game jam in Lyon on the theme “beware of appearances”: a platformer where the hero puts on a mask to reveal hidden platforms.',
			fr: 'Une game jam de 48 h à Lyon sur le thème «\u00a0méfiez-vous des apparences\u00a0»\u00a0: un jeu de plateforme où le héros enfile un masque pour révéler des plateformes cachées.'
		},
		summary: {
			en: 'A 48-hour platformer where a mask reveals hidden platforms.',
			fr: 'Un jeu de plateforme en 48\u00a0h où un masque révèle des plateformes cachées.'
		},
		date: '2024-03',
		context: 'hackathon',
		domains: ['games'],
		tech: ['C#', 'Unity'],
		links: { repo: gh('GameJam-Confiture-de-jeu-1') },
		hidden: true
	},
	{
		id: 'love-takedown',
		title: 'Love Takedown',
		description: {
			en: 'A game made as a team during a game jam.',
			fr: 'Un jeu réalisé en équipe lors d’une game jam.'
		},
		summary: {
			en: 'A game made as a team during a game jam.',
			fr: 'Un jeu réalisé en équipe lors d’une game jam.'
		},
		date: '2024-07',
		context: 'hackathon',
		domains: ['games'],
		tech: ['C#', 'Unity'],
		links: { repo: gh('Love_Takedown') },
		hidden: true
	},
	{
		id: 'so-long',
		title: 'So Long',
		description: {
			en: 'A 2D game built in C on top of the MiniLibX, a bare-bones graphics library: real-time game loop, sprite animations, enemies, and walls that tile themselves based on their neighbours. Before each game, the map is validated, down to checking that it can be completed.',
			fr: "Un jeu 2D développé en C sur la MiniLibX, une bibliothèque graphique minimaliste : boucle de jeu en temps réel, sprites animés, ennemis et murs qui s'ajustent automatiquement à leurs voisins. Avant chaque partie, la carte est validée, jusqu'à vérifier qu'elle est bien faisable."
		},
		summary: {
			en: 'A top-down 2D game in C with the MiniLibX, styled like Pokémon Mystery Dungeon.',
			fr: 'Un jeu 2D en vue de dessus en C avec la MiniLibX, façon Pokémon Donjon Mystère.'
		},
		date: '2023-05',
		context: 'school',
		domains: ['games', 'low-level'],
		tech: ['C', 'MiniLibX'],
		links: { repo: gh('so_long') },
		media: {
			kind: 'video',
			src: 'projects/so_long/demo.mp4',
			poster: 'projects/so_long/poster.webp',
			phone: 'projects/so_long/phone.webp'
		}
	},
	{
		id: 'cub3d',
		title: 'Cub3d',
		description: {
			en: 'A first-person 3D maze in the spirit of Wolfenstein 3D or Doom, built as a team in C on top of the MiniLibX, a bare-bones graphics library. The 3D view is drawn with raycasting: one ray per column of the screen, with a different texture for each side. Movement is smooth, and the map is parsed and validated before each game.',
			fr: "Un labyrinthe 3D à la première personne dans l'esprit de Wolfenstein 3D ou Doom, développé en équipe en C sur la MiniLibX, une bibliothèque graphique minimaliste. La vue 3D est dessinée par raycasting : un rayon par colonne de l'écran, avec une texture différente pour chaque face. Les déplacements sont fluides, et la carte est parsée et validée avant chaque partie."
		},
		summary: {
			en: 'A first-person 3D maze in C, drawn with raycasting like Wolfenstein 3D or Doom.',
			fr: 'Un labyrinthe 3D à la première personne en C, dessiné en raycasting comme Wolfenstein 3D ou Doom.'
		},
		date: '2024-04',
		context: 'school',
		domains: ['games', 'low-level'],
		tech: ['C', 'MiniLibX'],
		links: { repo: gh('42-cub3d') },
		media: {
			kind: 'video',
			src: 'projects/cub3d/demo.mp4',
			poster: 'projects/cub3d/poster.webp',
			phone: 'projects/cub3d/phone.webp'
		}
	},
	{
		id: 'minishell',
		title: 'Minishell',
		description: {
			en: "Our own shell in C, a lightweight version of Bash, the command interpreter of Linux and macOS. It handles quotes, variables, reading from and writing to files, and chains commands so that one's output feeds the next, all while matching Bash's behaviour down to the edge cases.",
			fr: "Notre propre shell en C, une version allégée de Bash, l'interpréteur de commandes de Linux et macOS. Il gère les guillemets, les variables, la lecture et l'écriture dans des fichiers, et enchaîne les commandes pour que le résultat de l'une alimente la suivante, en reproduisant le comportement de Bash jusque dans les cas limites."
		},
		summary: {
			en: 'Our own version of Bash in C, the program that runs the commands typed in a terminal.',
			fr: 'Notre propre version de Bash en C, le programme qui exécute les commandes tapées dans un terminal.'
		},
		date: '2023-10',
		context: 'school',
		domains: ['low-level'],
		tech: ['C', 'bash'],
		links: { repo: 'https://github.com/Edwardhug/minishell' },
		media: {
			kind: 'video',
			src: 'projects/minishell/demo.mp4',
			poster: 'projects/minishell/poster.webp',
			phone: 'projects/minishell/phone.webp'
		}
	},
	{
		id: 'ft-irc',
		title: 'ft_irc',
		description: {
			en: 'An IRC server in C++98, built as a team. IRC is one of the oldest chat protocols, where users meet in channels. Ours handles many clients at once and works with real ones like irssi or HexChat: private messages, channel operators, topics, invite-only or password-protected channels.',
			fr: 'Un serveur IRC en C++98, développé en binôme. IRC est l’un des plus anciens protocoles de messagerie, où l’on discute dans des salons. Le nôtre gère plusieurs clients à la fois et fonctionne avec de vrais clients comme irssi ou HexChat : messages privés, opérateurs, sujets, salons sur invitation ou protégés par mot de passe.'
		},
		summary: {
			en: 'An IRC server in C++98 that real clients like irssi or HexChat can connect to.',
			fr: 'Un serveur IRC en C++98 compatible avec de vrais clients comme irssi ou HexChat.'
		},
		date: '2024-05',
		context: 'school',
		domains: ['low-level'],
		tech: ['C++', 'sockets', 'poll()'],
		links: { repo: 'https://github.com/MarcelCerdan/ft_irc' },
		media: {
			kind: 'video',
			src: 'projects/irc/demo.mp4',
			poster: 'projects/irc/poster.webp',
			phone: 'projects/irc/phone.webp'
		}
	},
	{
		id: 'philosophers',
		title: 'Philosophers',
		description: {
			en: 'The dining philosophers problem in C: philosophers sit around a table, each needing two shared forks to eat, and must not starve. Each one is a thread and each fork a mutex, with no deadlocks or data races, and any death reported within 10 ms.',
			fr: 'Le problème du dîner des philosophes en C\u00a0: des philosophes autour d’une table doivent prendre deux fourchettes partagées pour manger, sans mourir de faim. Chacun est un thread et chaque fourchette un mutex, sans interblocage ni accès concurrent, et toute mort est signalée en moins de 10 ms.'
		},
		summary: {
			en: 'The dining philosophers problem in C, with threads and mutexes.',
			fr: 'Le problème du dîner des philosophes en C, avec threads et mutex.'
		},
		date: '2023-12',
		context: 'school',
		domains: ['low-level'],
		tech: ['C', 'threads'],
		links: { repo: gh('42-Philosophers') },
		media: {
			kind: 'video',
			src: 'projects/philosophers/demo.mp4',
			poster: 'projects/philosophers/poster.webp',
			phone: 'projects/philosophers/phone.webp'
		}
	},
	{
		id: 'red-tetris',
		title: 'Red Tetris',
		description: {
			en: 'An online multiplayer Tetris that runs in the browser, built as a team. The game runs on the server, which keeps every screen in sync in real time. Clearing lines send a penalty to your opponents, you can see their boards filling up, and the last player standing wins. Both the client and the server are covered by tests.',
			fr: 'Un Tetris multijoueur en ligne qui se joue dans le navigateur, développé en équipe. La partie tourne sur le serveur, qui synchronise tous les écrans en temps réel. Chaque ligne complétée envoie des pénalités aux adversaires, on voit leur plateau se remplir, et le dernier joueur en lice gagne. Le client comme le serveur sont couverts par des tests.'
		},
		summary: {
			en: 'An online multiplayer Tetris in the browser, synced in real time.',
			fr: 'Un Tetris multijoueur en ligne dans le navigateur, synchronisé en temps réel.'
		},
		date: '2026-09',
		context: 'school',
		domains: ['web', 'games'],
		tech: ['TypeScript', 'Svelte', 'Fastify', 'socket.io', 'Tailwind CSS', 'Vitest'],
		links: { repo: gh('42-red-tetris') },
		media: {
			kind: 'video',
			src: 'projects/red-tetris/demo.mp4',
			poster: 'projects/red-tetris/poster.webp',
			phone: 'projects/red-tetris/phone.webp'
		}
	}
]);

/** What the site shows. */
export const PROJECTS = visibleProjects(ALL_PROJECTS);
