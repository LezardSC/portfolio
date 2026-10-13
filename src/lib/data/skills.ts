import {
	siAndroidstudio,
	siBruno,
	siC,
	siCplusplus,
	siDjango,
	siDocker,
	siExpress,
	siFlask,
	siGit,
	siGithubactions,
	siIpfs,
	siJavascript,
	siJetpackcompose,
	siKotlin,
	siKubernetes,
	siLinux,
	siNginx,
	siNodedotjs,
	siOllama,
	siOpencv,
	siOpenjdk,
	siPostgresql,
	siPostman,
	siPython,
	siPytorch,
	siReact,
	siRust,
	siScikitlearn,
	siSolana,
	siSolidity,
	siSqlite,
	siSurrealdb,
	siSvelte,
	siTailwindcss,
	siThreedotjs,
	siTokio,
	siTypescript,
	siUnity,
	siXrp
} from 'simple-icons';
import type { SkillGroup } from '$lib/skills';
import { ICONS } from './icons';
import { CHAT, CPU, CSHARP, DATABASE, HARDHAT, NEURAL_NET, SMART_CONTRACT } from './skill-icons';
import { typeset } from '$lib/i18n/typography';

// French text may use plain spaces and straight apostrophes: typeset() adds the no-break spaces and ’
// (docs/content-guide.md). Always give typeset its type, typeset<X[]>(…): it keeps TypeScript's check
// of misspelled field names.

/** Group and chip order is display order. A skill may appear in several groups, once per group. */
export const SKILL_GROUPS = typeset<SkillGroup[]>([
	{
		id: 'backend',
		icon: ICONS.server,
		title: { en: 'Backend', fr: 'Backend' },
		description: {
			en: 'APIs, authentication and services.',
			fr: 'APIs, authentification et services.'
		},
		skills: [
			{ name: 'Python', icon: siPython },
			{ name: 'Rust', icon: siRust },
			{ name: 'Node.js', icon: siNodedotjs },
			{ name: 'TypeScript', icon: siTypescript },
			{ name: 'JavaScript', icon: siJavascript },
			{ name: 'Express', icon: siExpress },
			{ name: 'Django', icon: siDjango },
			{ name: 'Flask', icon: siFlask },
			{ name: 'Java', icon: siOpenjdk }
		]
	},
	{
		id: 'databases',
		icon: ICONS.database,
		title: { en: 'Databases', fr: 'Bases de données' },
		description: {
			en: 'Data modelling and queries, relational or not.',
			fr: 'Modélisation des données et requêtes, relationnelles ou non.'
		},
		skills: [
			{ name: 'SQL', icon: DATABASE },
			{ name: 'PostgreSQL', icon: siPostgresql },
			{ name: 'SQLite', icon: siSqlite },
			{ name: 'SurrealDB', icon: siSurrealdb }
		]
	},
	{
		id: 'systems',
		icon: ICONS.chip,
		title: { en: 'Systems & Low-level', fr: 'Systèmes & bas niveau' },
		description: {
			en: 'Code close to the machine: memory, processes, performance.',
			fr: 'Du code proche de la machine\u00a0: mémoire, processus, performance.'
		},
		skills: [
			{ name: 'Rust', icon: siRust },
			{ name: 'Tokio', icon: siTokio },
			{ name: 'C', icon: siC },
			{ name: 'C++', icon: siCplusplus },
			{ name: 'x86-64 Assembly', icon: CPU },
			{ name: 'Linux', icon: siLinux }
		]
	},
	{
		id: 'devops',
		icon: ICONS.cycle,
		title: { en: 'DevOps & Tools', fr: 'DevOps & outils' },
		description: {
			en: 'Containers, deployment, continuous integration and API testing.',
			fr: "Conteneurs, déploiement, intégration continue et tests d'API."
		},
		skills: [
			{ name: 'Docker', icon: siDocker },
			{ name: 'Kubernetes', icon: siKubernetes },
			{ name: 'Nginx', icon: siNginx },
			{ name: 'GitHub Actions (CI/CD)', icon: siGithubactions },
			{ name: 'Git', icon: siGit },
			{ name: 'Linux', icon: siLinux },
			{ name: 'Postman', icon: siPostman },
			{ name: 'Bruno', icon: siBruno }
		]
	},
	{
		id: 'ai',
		icon: ICONS.sparkles,
		title: { en: 'AI & ML', fr: 'IA & ML' },
		description: {
			en: 'Vision models, training and LLM agents.',
			fr: 'Modèles de vision, entraînement et agents LLM.'
		},
		skills: [
			{ name: 'Python', icon: siPython },
			{ name: 'PyTorch', icon: siPytorch },
			{ name: 'scikit-learn', icon: siScikitlearn },
			{ name: 'Deep Learning', icon: NEURAL_NET },
			{ name: 'Computer Vision', icon: siOpencv },
			{ name: { en: 'LLM agents', fr: 'Agents LLM' }, icon: siOllama },
			{ name: 'Prompt engineering', icon: CHAT }
		]
	},
	{
		id: 'blockchain',
		icon: ICONS.cube,
		title: { en: 'Blockchain', fr: 'Blockchain' },
		description: {
			en: 'Smart contracts, tokens and data anchored on-chain.',
			fr: 'Smart contracts, tokens et données ancrées on-chain.'
		},
		skills: [
			{ name: 'Solidity', icon: siSolidity },
			{ name: 'Hardhat', icon: HARDHAT },
			{ name: 'SmartPy', icon: SMART_CONTRACT },
			{ name: 'Solana', icon: siSolana },
			{ name: 'Rust', icon: siRust },
			{ name: 'XRPL', icon: siXrp },
			{ name: 'IPFS', icon: siIpfs }
		]
	},
	{
		id: 'frontend',
		icon: ICONS.code,
		title: { en: 'Frontend', fr: 'Frontend' },
		description: {
			en: 'Web interfaces when a project calls for them.',
			fr: 'Des interfaces web quand le projet le demande.'
		},
		skills: [
			{ name: 'TypeScript', icon: siTypescript },
			{ name: 'JavaScript', icon: siJavascript },
			{ name: 'SvelteKit', icon: siSvelte },
			{ name: 'React', icon: siReact },
			{ name: 'Tailwind CSS', icon: siTailwindcss },
			{ name: 'Three.js', icon: siThreedotjs }
		]
	},
	{
		id: 'mobile',
		icon: ICONS.phone,
		title: { en: 'Mobile', fr: 'Mobile' },
		description: {
			en: 'Native Android apps.',
			fr: 'Applications Android natives.'
		},
		skills: [
			{ name: 'Kotlin', icon: siKotlin },
			{ name: 'Jetpack Compose', icon: siJetpackcompose },
			{ name: 'Android Studio', icon: siAndroidstudio }
		]
	},
	{
		id: 'games',
		icon: ICONS.gamepad,
		title: { en: 'Games', fr: 'Jeux vidéo' },
		description: {
			en: 'Game engines and 3D, native or in the browser.',
			fr: 'Moteurs de jeu et 3D, en natif ou dans le navigateur.'
		},
		skills: [
			{ name: 'C#', icon: CSHARP },
			{ name: 'Unity', icon: siUnity },
			{ name: 'Three.js', icon: siThreedotjs }
		]
	}
]);
