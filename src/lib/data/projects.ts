import { visibleProjects, type Project } from '$lib/projects';
import { typeset } from '$lib/i18n/typography';

// French text may use plain spaces and straight apostrophes: typeset() adds the no-break spaces and ’
// (docs/content-guide.md). Always give typeset its type, typeset<X[]>(…): it keeps TypeScript's check
// of misspelled field names.

const gh = (repo: string) => `https://github.com/LezardSC/${repo}`;

/**
 * Priority order: these projects come first, in this order; every other project follows, newest
 * first. Not a separate category: the first 6 of whatever list is displayed (filters included)
 * get the big cards. Move a line to reorder. Every id must exist and not be hidden (a test checks it).
 */
export const PRIORITY: string[] = [
	'kayp-pbw-2024',
	'kayp-h-web3-paris',
	'ft-transcendence',
	'microcode',
	'bahapad',
	'goldeneye-data-augmentation'
];

/** Every project, hidden ones included. Order here doesn't matter: the page sorts them. */
export const ALL_PROJECTS = typeset<Project[]>([
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
		}
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
		award: { en: 'Winner - H-W3B Paris 2024', fr: 'Vainqueur - H-W3B Paris 2024' }
	},
	{
		id: 'ft-transcendence',
		title: 'ft_transcendence',
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
		tech: ['Python', 'JavaScript', 'Bootstrap', 'Docker'],
		links: { repo: gh('42-ft_transcendence') }
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
		links: { repo: gh('microcode') }
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
		}
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
		links: {}
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
		links: { repo: gh('42-tokenizArt') }
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
		links: { repo: gh('42-tokenizer') }
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
		links: { repo: gh('42-ft_linear_regression') }
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
		links: {}
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
		date: '2025-12',
		context: 'school',
		domains: ['ai'],
		tech: ['Python', 'PyTorch', 'PlantCV'],
		links: { repo: gh('42-Leaffliction') }
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
		links: { repo: gh('42-libasm') }
	},
	{
		id: 'libft',
		title: 'libft',
		description: {
			en: 'My own C standard library, the first 42 project, validated at 125%, and extended throughout the curriculum with extra functions.',
			fr: 'Ma propre bibliothèque standard C\u00a0: premier projet de 42, validé à 125\u00a0%, puis enrichie de nouvelles fonctions tout au long du cursus.'
		},
		summary: {
			en: 'My own C standard library, validated at 125%.',
			fr: 'Ma propre bibliothèque standard C, validée à 125\u00a0%.'
		},
		date: '2022-11',
		context: 'school',
		domains: ['low-level'],
		tech: ['C', 'Makefile'],
		links: { repo: gh('42-libft') }
	},
	{
		id: 'ft-printf',
		title: 'ft_printf',
		description: {
			en: 'A re-implementation of printf with variadic arguments, supporting the c, s, p, d, i, u, x and X conversions, packaged as a static library.',
			fr: 'Une réimplémentation de printf avec arguments variadiques, gérant les conversions c, s, p, d, i, u, x et X, livrée sous forme de bibliothèque statique.'
		},
		summary: {
			en: 'A re-implementation of printf, as a static library.',
			fr: 'Une réimplémentation de printf, en bibliothèque statique.'
		},
		date: '2022-11',
		context: 'school',
		domains: ['low-level'],
		tech: ['C'],
		links: { repo: gh('42-ft_printf') }
	},
	{
		id: 'get-next-line',
		title: 'get_next_line',
		description: {
			en: 'A function that reads a file descriptor one line at a time, whatever the buffer size: careful buffer handling and memory management in C.',
			fr: 'Une fonction qui lit un descripteur de fichier ligne par ligne, quelle que soit la taille du buffer\u00a0: gestion rigoureuse des buffers et de la mémoire en C.'
		},
		summary: {
			en: 'Reading a file line by line, whatever the buffer size.',
			fr: 'Lire un fichier ligne par ligne, quelle que soit la taille du buffer.'
		},
		date: '2022-11',
		context: 'school',
		domains: ['low-level'],
		tech: ['C'],
		links: { repo: gh('42-get_next_line') }
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
		links: { repo: gh('GameJam-Confiture-de-jeu-1') }
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
		links: { repo: gh('Love_Takedown') }
	}
]);

/** What the site shows. */
export const PROJECTS = visibleProjects(ALL_PROJECTS);
