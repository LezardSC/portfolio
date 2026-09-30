import {
	siC,
	siDjango,
	siDocker,
	siExpress,
	siGit,
	siGithubactions,
	siIpfs,
	siJavascript,
	siKubernetes,
	siLinux,
	siNginx,
	siNodedotjs,
	siOllama,
	siOpencv,
	siOpenjdk,
	siPandas,
	siPostgresql,
	siPython,
	siPytorch,
	siReact,
	siRust,
	siScikitlearn,
	siSolana,
	siSolidity,
	siSvelte,
	siTailwindcss,
	siTypescript,
	siXrp
} from 'simple-icons';
import type { SkillGroup } from '$lib/skills';
import { CHAT, CPU, DATABASE, HARDHAT } from './skill-icons';

/** Group and chip order is display order. Each skill belongs to exactly one group. */
export const SKILL_GROUPS: SkillGroup[] = [
	{
		id: 'backend',
		title: { en: 'Backend', fr: 'Backend' },
		skills: [
			{ name: 'Python', icon: siPython },
			{ name: 'Node.js', icon: siNodedotjs },
			{ name: 'Express', icon: siExpress },
			{ name: 'Django', icon: siDjango },
			{ name: 'Java', icon: siOpenjdk },
			{ name: 'SQL', icon: DATABASE },
			{ name: 'PostgreSQL', icon: siPostgresql }
		]
	},
	{
		id: 'systems',
		title: { en: 'Systems & Low-level', fr: 'Systèmes & bas niveau' },
		skills: [
			{ name: 'Rust', icon: siRust },
			{ name: 'C', icon: siC },
			{ name: 'x86-64 Assembly', icon: CPU },
			{ name: 'Linux', icon: siLinux }
		]
	},
	{
		id: 'devops',
		title: { en: 'DevOps & Tools', fr: 'DevOps & outils' },
		skills: [
			{ name: 'Docker', icon: siDocker },
			{ name: 'Kubernetes', icon: siKubernetes },
			{ name: 'Nginx', icon: siNginx },
			{ name: 'GitHub Actions (CI/CD)', icon: siGithubactions },
			{ name: 'Git', icon: siGit }
		]
	},
	{
		id: 'ai',
		title: { en: 'AI & ML', fr: 'IA & ML' },
		skills: [
			{ name: 'PyTorch', icon: siPytorch },
			{ name: 'scikit-learn', icon: siScikitlearn },
			{ name: 'pandas', icon: siPandas },
			{ name: { en: 'Computer Vision', fr: 'Vision par ordinateur' }, icon: siOpencv },
			{ name: { en: 'LLM agents', fr: 'Agents LLM' }, icon: siOllama },
			{ name: { en: 'Prompt engineering', fr: 'Ingénierie de prompts' }, icon: CHAT }
		]
	},
	{
		id: 'blockchain',
		title: { en: 'Blockchain', fr: 'Blockchain' },
		skills: [
			{ name: 'Solidity', icon: siSolidity },
			{ name: 'Hardhat', icon: HARDHAT },
			{ name: 'Solana', icon: siSolana },
			{ name: 'XRPL', icon: siXrp },
			{ name: 'IPFS', icon: siIpfs }
		]
	},
	{
		id: 'frontend',
		title: { en: 'Frontend', fr: 'Frontend' },
		skills: [
			{ name: 'TypeScript', icon: siTypescript },
			{ name: 'JavaScript', icon: siJavascript },
			{ name: 'SvelteKit', icon: siSvelte },
			{ name: 'React', icon: siReact },
			{ name: 'Tailwind CSS', icon: siTailwindcss }
		]
	}
];
