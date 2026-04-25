import React, { useState } from 'react';
import './ResourcesPage.css';

function AccordionSection({
	id,
	title,
	children,
	openSection,
	setOpenSection,
}) {
	const isOpen = openSection === id;

	return (
		<section className='resources-section'>
			<button
				className='resources-section-header'
				onClick={() => setOpenSection(isOpen ? null : id)}>
				<span>{title}</span>
				<span className='resources-section-chevron'>{isOpen ? '−' : '+'}</span>
			</button>

			{isOpen && <div className='resources-section-body'>{children}</div>}
		</section>
	);
}

export default function ResourcesPage() {
	const [openSection, setOpenSection] = useState('howto');

	return (
		<div className='resources-root'>
			<div className='resources-shell'>
				<header className='resources-header'>
					<h1>Mason Bee Resources</h1>
					<p className='resources-subtitle'>
						A curated guide for learning, growing, and supporting mason bees in
						your garden.
					</p>
				</header>

				{/* SECTION 1 — MOVED TO TOP */}
				<AccordionSection
					id='howto'
					title='1. How-To Guides: Gardening, Beehouses & Bee Care'
					openSection={openSection}
					setOpenSection={setOpenSection}>
					<p className='resources-intro'>
						Practical, step-by-step resources for creating habitat, maintaining
						beehouses, and caring for mason bees throughout the year.
					</p>

					<h3>Featured Videos</h3>
					<ul>
						<li>
							<strong>Where Do Mason Bees Sleep at Night?</strong>
							<p>
								A fun nighttime look at shimmering bee bums resting in nesting
								blocks.
							</p>
							<a
								href='https://www.youtube.com/watch?v=pzjGBWEbBV4&t=31s'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Watch on YouTube
							</a>
						</li>

						<li>
							<strong>How to Care For Your Mason Bees All Year Long</strong>
							<p>
								WSU Bee Program explains seasonal care and year‑round support.
							</p>
							<a
								href='https://www.youtube.com/watch?v=t5HtsikuvAU'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Watch on YouTube
							</a>
						</li>
					</ul>

					<h3>Seasonal Care & Year‑Round Support</h3>
					<ul>
						<li>
							<strong>How to Support Mason Bees Year‑Round</strong>
							<p>
								David Suzuki Foundation guide to habitat, bloom timing, and
								seasonal care.
							</p>
							<a
								href='https://davidsuzuki.org/living-green/how-to-support-mason-bees-year-round/'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>
					</ul>

					<h3>Setting Up a Mason Bee House</h3>
					<ul>
						<li>
							<strong>Crown Bees – Mason Bee Setup Guides</strong>
							<p>Placement, maintenance, and harvesting.</p>
							<a
								href='https://crownbees.com'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>

						<li>
							<strong>
								Oregon State University – Nesting Box Best Practices
							</strong>
							<p>Materials, placement, and avoiding pests.</p>
							<a
								href='https://extension.oregonstate.edu'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>
					</ul>

					<h3>Cleaning & Caring for Mason Bees</h3>
					<ul>
						<li>
							<strong>Crown Bees – How to Clean Cocoons</strong>
							<p>Step-by-step winter cleaning instructions.</p>
							<a
								href='https://crownbees.com'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>
					</ul>
				</AccordionSection>

				{/* SECTION 2 */}
				<AccordionSection
					id='plants'
					title='2. Plants, Trees & Shrubs for Mason Bees'
					openSection={openSection}
					setOpenSection={setOpenSection}>
					<p className='resources-intro'>
						What to plant, when it blooms, and how it supports mason bees.
					</p>

					<h3>Early-Blooming Trees & Shrubs</h3>
					<ul>
						<li>
							<strong>Cornell University – Early Spring Flowering Trees</strong>
							<p>Species that bloom during mason bee emergence.</p>
							<a
								href='https://cornell.edu'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>
					</ul>

					<h3>Flowering Plants Mason Bees Love</h3>
					<ul>
						<li>
							<strong>Xerces Society – Pollinator Plant Lists</strong>
							<p>Region-specific lists with bloom windows.</p>
							<a
								href='https://xerces.org/pollinator-conservation/plant-lists'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>

						<li>
							<strong>USDA Plants Database – Native Flowering Plants</strong>
							<p>Searchable by region and bloom timing.</p>
							<a
								href='https://plants.usda.gov'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>
					</ul>

					<h3>Plant–Bee Relationships</h3>
					<ul>
						<li>
							<strong>Pollinator.org – Ecoregional Planting Guides</strong>
							<p>Which plants support which pollinators and when they bloom.</p>
							<a
								href='https://www.pollinator.org/guides'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>

						<li>
							<strong>
								Royal Horticultural Society – Plants for Solitary Bees
							</strong>
							<p>Nectar, pollen, and bloom timing.</p>
							<a
								href='https://www.rhs.org.uk'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>
					</ul>
				</AccordionSection>

				{/* SECTION 3 */}
				<AccordionSection
					id='beginners'
					title='3. Beginner’s Guide to Mason Bees'
					openSection={openSection}
					setOpenSection={setOpenSection}>
					<p className='resources-intro'>
						Learn the basics: life cycle, behavior, biology, and how these
						gentle pollinators fit into your ecosystem.
					</p>

					<h3>Understanding Mason Bees</h3>
					<ul>
						<li>
							<strong>Xerces Society – Mason Bee Fact Sheet</strong>
							<p>
								Overview of mason bee species, their role as pollinators, and
								how to support them.
							</p>
							<a
								href='https://xerces.org'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>
					</ul>

					<h3>Life Cycle & Seasonal Timing</h3>
					<ul>
						<li>
							<strong>USDA Forest Service – Native Bee Life Cycles</strong>
							<p>Emergence, nesting, and overwintering explained simply.</p>
							<a
								href='https://www.fs.usda.gov/managing-land/wildflowers/pollinators'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>

						<li>
							<strong>Pollinator Partnership – Early Spring Bees</strong>
							<p>Bloom timing and early-season pollinators.</p>
							<a
								href='https://www.pollinator.org'
								target='_blank'
								rel='noopener noreferrer'
								className='resource-button'>
								Open Resource
							</a>
						</li>
					</ul>
				</AccordionSection>
			</div>
		</div>
	);
}
