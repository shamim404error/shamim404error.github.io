/**
 * ============================================================================
 * DIGITAL AURORA — Master Interactions & Animations Engine
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    // Environment & Accessibility checks
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    /* ------------------------------------------------------------------------
       1. CUSTOM CURSOR & MAGNETIC BUTTONS
       ------------------------------------------------------------------------ */
    const initCursor = () => {
        if (isTouchDevice) return;

        const cursorDot = document.getElementById('custom-cursor');
        const cursorFollower = document.getElementById('custom-follower');
        if (!cursorDot || !cursorFollower) return;

        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let followerX = mouseX;
        let followerY = mouseY;

        // Immediate position for main dot
        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
        }, { passive: true });

        // Lerp loop for follower
        const updateFollower = () => {
            const ease = 0.16;
            followerX += (mouseX - followerX) * ease;
            followerY += (mouseY - followerY) * ease;

            cursorFollower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0) translate(-50%, -50%)`;
            requestAnimationFrame(updateFollower);
        };
        requestAnimationFrame(updateFollower);

        // Interactive hover states
        const interactiveElements = document.querySelectorAll(
            'a, button, .project-card, .lab__module, .contact__card, .skill-node'
        );

        interactiveElements.forEach((el) => {
            el.addEventListener('mouseenter', () => {
                cursorFollower.classList.add('cursor--active');
                if (el.classList.contains('project-card')) {
                    cursorFollower.classList.add('cursor--text');
                }
            });

            el.addEventListener('mouseleave', () => {
                cursorFollower.classList.remove('cursor--active', 'cursor--text');
            });
        });

        // Magnetic button pull
        const magneticBtns = document.querySelectorAll('.btn-primary, .btn-secondary, .nav__logo');
        magneticBtns.forEach((btn) => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const btnCenterX = rect.left + rect.width / 2;
                const btnCenterY = rect.top + rect.height / 2;
                const distanceX = e.clientX - btnCenterX;
                const distanceY = e.clientY - btnCenterY;

                btn.style.transform = `translate(${distanceX * 0.25}px, ${distanceY * 0.25}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0px, 0px)';
            });
        });
    };

    /* ------------------------------------------------------------------------
       2. FLOATING NAVIGATION & SCROLLSPY
       ------------------------------------------------------------------------ */
    const initNavigation = () => {
        const nav = document.getElementById('navbar');
        const hamburger = document.getElementById('nav-hamburger');
        const mobileOverlay = document.getElementById('mobile-overlay');
        const navLinks = document.querySelectorAll('.nav__link');
        const mobileLinks = document.querySelectorAll('.mobile-overlay__link');
        const sections = document.querySelectorAll('section[id]');

        // Sticky nav opacity change on scroll
        const handleScroll = () => {
            if (window.scrollY > 45) {
                nav.classList.add('nav--scrolled');
            } else {
                nav.classList.remove('nav--scrolled');
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        // Scrollspy active section detection
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const currentId = entry.target.getAttribute('id');
                    navLinks.forEach((link) => {
                        const href = link.getAttribute('href').replace('#', '');
                        if (href === currentId) {
                            link.classList.add('nav__link--active');
                        } else {
                            link.classList.remove('nav__link--active');
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach((sec) => sectionObserver.observe(sec));

        // Mobile drawer menu toggle
        if (hamburger && mobileOverlay) {
            const toggleMobileMenu = () => {
                const isOpen = mobileOverlay.classList.contains('open');
                if (isOpen) {
                    closeMobileMenu();
                } else {
                    openMobileMenu();
                }
            };

            const openMobileMenu = () => {
                hamburger.classList.add('active');
                hamburger.setAttribute('aria-expanded', 'true');
                mobileOverlay.classList.add('open');
                mobileOverlay.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            };

            const closeMobileMenu = () => {
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                mobileOverlay.classList.remove('open');
                mobileOverlay.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            };

            hamburger.addEventListener('click', toggleMobileMenu);

            mobileLinks.forEach((link) => {
                link.addEventListener('click', closeMobileMenu);
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && mobileOverlay.classList.contains('open')) {
                    closeMobileMenu();
                }
            });
        }
    };

    /* ------------------------------------------------------------------------
       3. SCROLL REVEAL ANIMATIONS
       ------------------------------------------------------------------------ */
    const initScrollReveals = () => {
        const revealElements = document.querySelectorAll('.reveal');
        if (prefersReducedMotion) {
            revealElements.forEach(el => el.classList.add('revealed'));
            return;
        }

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach((el, index) => {
            el.style.transitionDelay = `${(index % 3) * 80}ms`;
            revealObserver.observe(el);
        });
    };

    /* ------------------------------------------------------------------------
       4. ABOUT CARD 3D TILT
       ------------------------------------------------------------------------ */
    const initAboutCard = () => {
        if (isTouchDevice || prefersReducedMotion) return;

        const card = document.getElementById('about-card');
        if (!card) return;

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -12;
            const rotateY = ((x - centerX) / centerX) * 12;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    };

    /* ------------------------------------------------------------------------
       5. INTERACTIVE TECHNOLOGY CONSTELLATION
       ------------------------------------------------------------------------ */
    const initSkillsConstellation = () => {
        const constellation = document.getElementById('skills-constellation');
        const svgLines = document.getElementById('skills-lines');
        const tooltip = document.getElementById('skills-tooltip');
        const tooltipIcon = document.getElementById('tooltip-icon');
        const tooltipTitle = document.getElementById('tooltip-title');
        const tooltipDesc = document.getElementById('tooltip-desc');
        if (!constellation || !svgLines) return;

        const nodes = constellation.querySelectorAll('.skill-node');

        // Draw dynamic connecting constellation lines
        const drawLines = (highlightedIndex = null) => {
            svgLines.innerHTML = '';
            const cRect = constellation.getBoundingClientRect();
            const nodeCenters = [];

            nodes.forEach((node) => {
                const nRect = node.getBoundingClientRect();
                nodeCenters.push({
                    x: nRect.left + nRect.width / 2 - cRect.left,
                    y: nRect.top + nRect.height / 2 - cRect.top
                });
            });

            // Connect nearby nodes
            const maxDistance = cRect.width * 0.42;

            for (let i = 0; i < nodeCenters.length; i++) {
                for (let j = i + 1; j < nodeCenters.length; j++) {
                    const dx = nodeCenters[i].x - nodeCenters[j].x;
                    const dy = nodeCenters[i].y - nodeCenters[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < maxDistance) {
                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', nodeCenters[i].x);
                        line.setAttribute('y1', nodeCenters[i].y);
                        line.setAttribute('x2', nodeCenters[j].x);
                        line.setAttribute('y2', nodeCenters[j].y);

                        const isConnectedToHovered = highlightedIndex !== null && (i === highlightedIndex || j === highlightedIndex);

                        if (isConnectedToHovered) {
                            line.setAttribute('stroke', '#00e5ff');
                            line.setAttribute('stroke-width', '2');
                            line.setAttribute('stroke-opacity', '0.75');
                        } else {
                            line.setAttribute('stroke', '#9b6dff');
                            line.setAttribute('stroke-width', '1');
                            line.setAttribute('stroke-opacity', '0.18');
                        }

                        svgLines.appendChild(line);
                    }
                }
            }
        };

        // Initial line render
        setTimeout(drawLines, 300);
        window.addEventListener('resize', () => drawLines(), { passive: true });

        // Node hover / click interaction
        nodes.forEach((node, index) => {
            const skillName = node.getAttribute('data-skill');
            const skillCategory = node.getAttribute('data-category') || 'Technology';
            const skillDesc = node.getAttribute('data-description');
            const skillIcon = node.querySelector('.skill-node__icon')?.textContent || '◆';

            const activateNode = () => {
                nodes.forEach((n, idx) => {
                    if (idx !== index) {
                        n.style.opacity = '0.35';
                        n.classList.remove('active');
                    } else {
                        n.style.opacity = '1';
                        n.classList.add('active');
                    }
                });

                if (tooltip && tooltipTitle && tooltipDesc) {
                    tooltipIcon.textContent = skillIcon;
                    tooltipTitle.textContent = `${skillName} • ${skillCategory}`;
                    tooltipDesc.textContent = skillDesc;
                    tooltip.style.opacity = '1';
                }

                drawLines(index);
            };

            const resetNodes = () => {
                nodes.forEach((n) => {
                    n.style.opacity = '1';
                    n.classList.remove('active');
                });
                drawLines(null);
            };

            node.addEventListener('mouseenter', activateNode);
            node.addEventListener('mouseleave', resetNodes);

            if (isTouchDevice) {
                node.addEventListener('click', (e) => {
                    e.stopPropagation();
                    activateNode();
                });
            }
        });

        // Mouse parallax shift
        if (!isTouchDevice && !prefersReducedMotion) {
            constellation.addEventListener('mousemove', (e) => {
                const rect = constellation.getBoundingClientRect();
                const offsetX = (e.clientX - rect.left - rect.width / 2) * 0.04;
                const offsetY = (e.clientY - rect.top - rect.height / 2) * 0.04;

                nodes.forEach((node) => {
                    const depth = parseFloat(node.getAttribute('data-depth')) || 1.0;
                    node.style.transform = `translate3d(${offsetX * depth}px, ${offsetY * depth}px, 0)`;
                });
            });

            constellation.addEventListener('mouseleave', () => {
                nodes.forEach((node) => {
                    node.style.transform = 'translate3d(0, 0, 0)';
                });
            });
        }
    };

    /* ------------------------------------------------------------------------
       6. PROJECT CARDS 3D TILT
       ------------------------------------------------------------------------ */
    const initProjectCards = () => {
        if (isTouchDevice || prefersReducedMotion) return;

        const cards = document.querySelectorAll('.project-card');

        cards.forEach((card) => {
            const visual = card.querySelector('.project-card__visual');

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;

                if (visual) {
                    visual.style.transform = `translate3d(${rotateY * 2}px, ${-rotateX * 2}px, 0)`;
                }
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
                if (visual) {
                    visual.style.transform = 'translate3d(0, 0, 0)';
                }
            });
        });
    };

    /* ------------------------------------------------------------------------
       7. DIGITAL LAB MODULES INTERACTION
       ------------------------------------------------------------------------ */
    const initLabModules = () => {
        const modules = document.querySelectorAll('.lab__module');

        modules.forEach((mod) => {
            mod.addEventListener('mouseenter', () => {
                modules.forEach(m => m.classList.remove('expanded'));
                mod.classList.add('expanded');
            });

            mod.addEventListener('mouseleave', () => {
                mod.classList.remove('expanded');
            });

            if (isTouchDevice) {
                mod.addEventListener('click', () => {
                    const isExp = mod.classList.contains('expanded');
                    modules.forEach(m => m.classList.remove('expanded'));
                    if (!isExp) mod.classList.add('expanded');
                });
            }
        });
    };

    /* ------------------------------------------------------------------------
       8. JOURNEY TIMELINE SEQUENTIAL REVEAL
       ------------------------------------------------------------------------ */
    const initJourneyTimeline = () => {
        const timeline = document.querySelector('.timeline');
        const nodes = document.querySelectorAll('.timeline-node');
        if (!timeline || nodes.length === 0) return;

        const timelineObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    nodes.forEach((node, idx) => {
                        setTimeout(() => {
                            node.classList.add('active');
                        }, idx * 160);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.25 });

        timelineObserver.observe(timeline);
    };

    /* ------------------------------------------------------------------------
       9. CONTACT FORM HANDLING (Graceful Frontend)
       ------------------------------------------------------------------------ */
    const initContactForm = () => {
        const form = document.getElementById('contact-form');
        const submitBtn = document.getElementById('btn-submit');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('contact-name')?.value.trim() || 'Visitor';
            const email = document.getElementById('contact-email')?.value.trim() || '';
            const message = document.getElementById('contact-message')?.value.trim() || '';

            const subject = encodeURIComponent(`Portfolio Opportunity / Project Inquiry from ${name}`);
            const body = encodeURIComponent(
                `Hi Shamim,\n\n${message}\n\n-------------------------\nFrom: ${name}\nEmail: ${email}`
            );

            // Construct mailto link
            const mailtoUrl = `mailto:shamimmizanurrahman87@gmail.com?subject=${subject}&body=${body}`;

            if (submitBtn) {
                const originalHtml = submitBtn.innerHTML;
                submitBtn.innerHTML = '<span>Opening Mail Client...</span> <span>✓</span>';
                submitBtn.classList.add('success');

                setTimeout(() => {
                    window.location.href = mailtoUrl;
                }, 400);

                setTimeout(() => {
                    submitBtn.innerHTML = originalHtml;
                    submitBtn.classList.remove('success');
                    form.reset();
                }, 4000);
            } else {
                window.location.href = mailtoUrl;
            }
        });
    };

    /* ------------------------------------------------------------------------
       10. HERO TEXT REVEAL ENHANCEMENT
       ------------------------------------------------------------------------ */
    const initHeroReveal = () => {
        const heroTitle = document.querySelector('.hero__title');
        if (!heroTitle || prefersReducedMotion) return;

        // Subtle initial entrance for hero
        setTimeout(() => {
            heroTitle.classList.add('revealed');
        }, 120);
    };

    /* ------------------------------------------------------------------------
       INITIALIZATION
       ------------------------------------------------------------------------ */
    initCursor();
    initNavigation();
    initScrollReveals();
    initAboutCard();
    initSkillsConstellation();
    initProjectCards();
    initLabModules();
    initJourneyTimeline();
    initContactForm();
    initHeroReveal();
});
