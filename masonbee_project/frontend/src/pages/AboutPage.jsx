import React from 'react';
import './AboutPage.css';

export default function AboutPage() {
	return (
		<div className='page-wrapper about-page'>
			<header className='about-page__header'>
				<h1>About the Developer</h1>
				<p className='about-page__subtitle'>A little about me.</p>
			</header>

			<section className='about-page__content'>
				<p>
					<strong>Hi, I’m Travis — the creator of MasonBee.</strong> This
					project began as a way to help people understand and support native
					mason bees in their own neighborhoods. I built MasonBee to make it
					simple for gardeners, educators, and nature‑curious folks to check
					whether a location has the natural resources mason bees rely on.
				</p>

				<p>
					I’m passionate about native pollinators, accessible environmental
					tools, and building software that helps people connect with the
					natural world around them. MasonBee is an ongoing project, and I’m
					excited to continue improving it over time.
				</p>
			</section>
		</div>
	);
}
