const FALLBACK_DATA = {
  "destinations": [
    {
      "id": "dest-bwindi",
      "name": "Bwindi Impenetrable National Park",
      "region": "Western Uganda",
      "summary": "Mountain gorilla trekking, Batwa cultural experiences, scenic forest drives, and intimate lodge stays.",
      "imageUrl": "assets/package-bwindi.webp",
      "featured": true
    },
    {
      "id": "dest-kidepo",
      "name": "Kidepo Valley National Park",
      "region": "Northern Uganda",
      "summary": "Remote wilderness, dramatic savannah landscapes, game drives, wildlife, and authentic cultural encounters.",
      "imageUrl": "assets/package-kidepo.webp",
      "featured": true
    },
    {
      "id": "dest-murchison",
      "name": "Murchison Falls National Park",
      "region": "Northwestern Uganda",
      "summary": "Nile boat cruises, game drives, the top of the falls, giraffes, elephants, and memorable photography stops.",
      "imageUrl": "assets/package-murchison.webp",
      "featured": true
    },
    {
      "id": "dest-bunyonyi",
      "name": "Lake Bunyonyi",
      "region": "Southwestern Uganda",
      "summary": "A peaceful island-dotted lake for wellness retreats, canoe rides, sunrise views, and slow nature escapes.",
      "imageUrl": "assets/package-bunyonyi.webp",
      "featured": false
    },
    {
      "id": "dest-jinja",
      "name": "Jinja",
      "region": "Eastern Uganda",
      "summary": "White-water rafting, the Source of the Nile, adrenaline activities, photography, and lively weekend breaks.",
      "imageUrl": "assets/package-jinja.webp",
      "featured": false
    },
    {
      "id": "dest-sipi",
      "name": "Sipi Falls & Mount Elgon",
      "region": "Eastern Uganda",
      "summary": "Waterfall hikes, coffee experiences, mountain air, green landscapes, and rich local experiences.",
      "imageUrl": "assets/package-sipi.webp",
      "featured": false
    },
    {
      "id": "dest-fort-portal",
      "name": "Fort Portal",
      "region": "Western Uganda",
      "summary": "Crater lakes, tea plantations, waterfalls, nature walks, wellness, and lush countryside scenery.",
      "imageUrl": "assets/package-fortportal.webp",
      "featured": false
    }
  ],
  "trips": [
    {
      "id": "trip-bwindi-3-day",
      "title": "Bwindi Gorilla Trekking Experience",
      "destination": "Bwindi Impenetrable National Park",
      "category": "Gorilla Trekking",
      "duration": "3 days",
      "days": 3,
      "price": 1600,
      "summary": "Includes a gorilla trekking permit, accommodation, full-board meals, return transport, an English-speaking guide, park fees, and bottled water. Price shown is the from rate for larger groups.",
      "imageUrl": "assets/package-bwindi.webp",
      "featured": true
    },
    {
      "id": "trip-bwindi-bunyonyi-4-day",
      "title": "Gorilla Trekking & Lake Bunyonyi Escape",
      "destination": "Bwindi & Lake Bunyonyi",
      "category": "Wildlife & Wellness",
      "duration": "4 days",
      "days": 4,
      "price": 1950,
      "summary": "Combine a lifetime gorilla encounter with a relaxing Lake Bunyonyi escape, scenic drives, local culture, and beautiful photography opportunities.",
      "imageUrl": "assets/package-bwindi-bunyonyi.webp",
      "featured": false
    },
    {
      "id": "trip-kidepo-3-day",
      "title": "Kidepo Valley National Park Adventure",
      "destination": "Kidepo Valley National Park",
      "category": "Safari",
      "duration": "3 days \u2022 2 nights",
      "days": 3,
      "price": 890,
      "summary": "Luxury accommodation, multiple game drives, a cultural visit, park fees, full-board meals, a professional guide, and Kampala\u2013Kidepo return transport.",
      "imageUrl": "assets/package-kidepo.webp",
      "featured": true
    },
    {
      "id": "trip-murchison-2-day",
      "title": "Murchison Falls National Park Safari",
      "destination": "Murchison Falls National Park",
      "category": "Safari & Boat Cruise",
      "duration": "2 days \u2022 1 night",
      "days": 2,
      "price": 250,
      "summary": "Return transport, one night of accommodation, meals, a game drive, Nile boat cruise, top-of-the-falls visit, guide, bottled water, and photography stops.",
      "imageUrl": "assets/package-murchison.webp",
      "featured": true
    },
    {
      "id": "trip-bunyonyi-2-day",
      "title": "Lake Bunyonyi Wellness Retreat",
      "destination": "Lake Bunyonyi",
      "category": "Wellness Retreat",
      "duration": "2 days",
      "days": 2,
      "price": 270,
      "summary": "Lake-view accommodation, canoe ride, island visit, sunrise and sunset experiences, guided wellness walk, breakfast, and return transport.",
      "imageUrl": "assets/package-bunyonyi.webp",
      "featured": false
    },
    {
      "id": "trip-jinja-2-day",
      "title": "Jinja Adrenaline Adventure",
      "destination": "Jinja",
      "category": "Adventure",
      "duration": "2 days \u2022 1 night",
      "days": 2,
      "price": 140,
      "summary": "Return transport, one-night accommodation, white-water rafting, a Source of the Nile visit, photography, and breakfast. Accommodation upgrades are available.",
      "imageUrl": "assets/package-jinja.webp",
      "featured": false
    },
    {
      "id": "trip-sipi-elgon",
      "title": "Sipi Falls & Mount Elgon Escape",
      "destination": "Sipi Falls & Mount Elgon",
      "category": "Hiking & Culture",
      "duration": "Flexible itinerary",
      "price": 365,
      "summary": "Accommodation, transport, a guided waterfall hike, coffee experience, nature walks, meals, and photography in Eastern Uganda.",
      "imageUrl": "assets/package-sipi.webp",
      "featured": false
    },
    {
      "id": "trip-fort-portal-2-day",
      "title": "Fort Portal Nature & Wellness Experience",
      "destination": "Fort Portal",
      "category": "Nature & Wellness",
      "duration": "2 days",
      "days": 2,
      "price": 225,
      "summary": "Luxury accommodation, return transport, crater lake tour, tea plantation walk, waterfall visit, nature walks, breakfast, photography, and a local host.",
      "imageUrl": "assets/package-fortportal.webp",
      "featured": false
    }
  ],
  "posts": [
    {
      "id": "post-uganda-safari-tips",
      "title": "What to Pack for a Uganda Safari",
      "author": "Explore Bloom & Beyond Team",
      "publishedAt": "2026-07-01",
      "excerpt": "A practical checklist for game drives, gorilla trekking, lodge stays, and changing weather.",
      "imageUrl": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
      "content": "Pack comfortable layers, neutral clothing, sunscreen, insect repellent, binoculars, reusable water bottle, camera batteries, and a small day bag. For gorilla trekking, add hiking shoes, garden gloves, rain gear, and long sleeves."
    },
    {
      "id": "post-zanzibar-guide",
      "title": "A First-Timer Guide to Zanzibar",
      "author": "Explore Bloom & Beyond Team",
      "publishedAt": "2026-06-20",
      "excerpt": "How to mix beach relaxation with Stone Town, spice tours, and local food experiences.",
      "imageUrl": "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80",
      "content": "Spend time on the beach, visit Stone Town, tour spice farms, try local seafood, and plan boat activities around tide conditions. Zanzibar pairs beautifully with a safari in Tanzania, Kenya, or Uganda."
    },
    {
      "id": "post-group-travel",
      "title": "How to Plan a Smooth Group Trip",
      "author": "Explore Bloom & Beyond Team",
      "publishedAt": "2026-06-02",
      "excerpt": "Simple planning tips for family holidays, company retreats, and school trips.",
      "imageUrl": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80",
      "content": "Choose a clear budget, collect traveler details early, agree on must-have activities, and assign one group contact person. A shared itinerary and early rooming list make the experience smoother."
    },
    {
      "id": "post-best-time-uganda",
      "title": "Best Time to Visit Uganda for Safaris and Gorillas",
      "author": "Explore Bloom & Beyond Team",
      "publishedAt": "2026-05-12",
      "excerpt": "A seasonal guide for wildlife viewing, gorilla trekking, family travel, and photography.",
      "imageUrl": "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=80",
      "content": "Uganda is a year-round destination, but many travelers prefer the drier months for easier trekking and game drives. Green seasons can offer lush scenery, birdlife, and fewer crowds."
    },
    {
      "id": "post-honeymoon-safari",
      "title": "Safari Honeymoon Ideas for East Africa",
      "author": "Explore Bloom & Beyond Team",
      "publishedAt": "2026-04-25",
      "excerpt": "Romantic ways to combine wildlife, private lodges, beaches, sunset cruises, and slow travel.",
      "imageUrl": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=900&q=80",
      "content": "A strong honeymoon itinerary balances adventure and rest. Pair a private safari lodge with beach days, scenic flights, candle-lit dinners, and flexible transfers so the trip never feels rushed."
    },
    {
      "id": "post-travel-budget",
      "title": "How to Budget for an African Safari",
      "author": "Explore Bloom & Beyond Team",
      "publishedAt": "2026-04-03",
      "excerpt": "Understand permits, accommodation, transport, park fees, meals, and private guide costs before booking.",
      "imageUrl": "https://images.unsplash.com/photo-1528277342758-f1d7613953a2?auto=format&fit=crop&w=900&q=80",
      "content": "Your safari budget depends on season, accommodation style, transport distance, permits, park fees, group size, and guide level. Sharing your budget early helps the travel team design realistic options."
    }
  ],
  "socials": [
    {
      "id": "contact-whatsapp",
      "platform": "WhatsApp",
      "handle": "+256 788 518714",
      "url": "https://wa.me/256788518714"
    },
    {
      "id": "contact-email",
      "platform": "Email",
      "handle": "info@explorebloomandbeyond.com",
      "url": "mailto:info@explorebloomandbeyond.com"
    },
    {
      "id": "contact-website",
      "platform": "Website",
      "handle": "explorebloomandbeyond.com",
      "url": "https://www.explorebloomandbeyond.com"
    }
  ]
};

const state = {
  ...FALLBACK_DATA,
  activeChatId: localStorage.getItem('safariskyChatId') || '',
  supportTimer: null
};

const MARKETING_CONFIG = {
  // Replace these placeholders with your real Google IDs before launch.
  googleAnalyticsId: 'G-XXXXXXXXXX',
  googleAdsId: 'AW-XXXXXXXXXX',
  googleAdsConversionLabel: 'REPLACE_WITH_CONVERSION_LABEL'
};

initMarketing();
initHeroSlider();
initAccountNavigation();

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const bookingForm = document.querySelector('#bookingForm');
const formMessage = document.querySelector('#formMessage');
const startDate = document.querySelector('#startDate');
const tripSelect = document.querySelector('#tripSelect');
const destinationSelect = document.querySelector('#destinationSelect');
const requestModal = document.querySelector('#requestModal');
const destinationRequestForm = document.querySelector('#destinationRequestForm');
const modalFormMessage = document.querySelector('#modalFormMessage');
const modalTrip = document.querySelector('#modalTrip');
const modalStartDate = document.querySelector('#modalStartDate');
const supportPanel = document.querySelector('#supportPanel');
const supportForm = document.querySelector('#supportForm');
const supportMessages = document.querySelector('#supportMessages');
const supportStatus = document.querySelector('#supportStatus');
const supportIdentityFields = document.querySelector('#supportIdentityFields');

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const today = new Date().toISOString().split('T')[0];
[startDate, modalStartDate].forEach((dateField) => {
  if (dateField) dateField.min = today;
});

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

loadPublicContent();

if (bookingForm) {
  bookingForm.addEventListener('submit', submitBooking);
}

if (destinationRequestForm) {
  destinationRequestForm.addEventListener('submit', submitDestinationRequest);
}

document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', closeDestinationModal);
});

requestModal?.addEventListener('click', (event) => {
  if (event.target === requestModal) closeDestinationModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDestinationModal();
    closeSupportPanel();
  }
});

document.querySelectorAll('[data-open-support]').forEach((button) => {
  button.addEventListener('click', openSupportPanel);
});

document.querySelectorAll('[data-close-support]').forEach((button) => {
  button.addEventListener('click', closeSupportPanel);
});


document.querySelectorAll('[data-open-custom-request]').forEach((button) => {
  button.addEventListener('click', openCustomRequestModal);
});

if (supportForm) {
  supportForm.addEventListener('submit', submitSupportMessage);
}

async function loadPublicContent() {
  try {
    const response = await fetch('/api/content');
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    state.destinations = data.destinations?.length ? data.destinations : FALLBACK_DATA.destinations;
    state.trips = data.trips?.length ? data.trips : FALLBACK_DATA.trips;
    state.posts = data.posts?.length ? data.posts : FALLBACK_DATA.posts;
    state.socials = data.socials?.length ? data.socials : FALLBACK_DATA.socials;
  } catch (error) {
    console.info('Using fallback content because the backend is not running yet.');
  }

  renderDestinations(state.destinations);
  renderTrips(state.trips);
  renderBlog(state.posts);
  renderSocials(state.socials);
  renderTripSelect(state.trips);
  renderDestinationSelect(state.destinations);
  renderFeaturedTrip(state.trips);
  renderChatPlaceholder();

  if (state.activeChatId) {
    refreshChat();
  }
}

function renderDestinations(destinations) {
  const grid = document.querySelector('#destinationsGrid');
  if (!grid) return;
  const limit = Number(grid.dataset.limit || 0);
  const visibleDestinations = limit ? destinations.filter((destination) => destination.featured).slice(0, limit) : destinations;
  const finalDestinations = visibleDestinations.length ? visibleDestinations : destinations.slice(0, limit || destinations.length);

  grid.classList.add('loaded');
  grid.innerHTML = finalDestinations.length
    ? finalDestinations.map((destination) => `
      <article class="destination-card clickable-card" style="background-image: url('${escapeAttribute(destination.imageUrl || fallbackImage(destination.name))}')">
        <span class="destination-meta">${escapeHtml(destination.region || 'Featured destination')}</span>
        <h3>${escapeHtml(destination.name)}</h3>
        <p>${escapeHtml(destination.summary)}</p>
        <button class="card-action" type="button" data-destination-id="${escapeAttribute(destination.id)}">Book Now</button>
      </article>
    `).join('')
    : '<div class="empty-state">No destinations have been added yet.</div>';

  grid.querySelectorAll('[data-destination-id]').forEach((button) => {
    button.addEventListener('click', () => openDestinationModal(button.dataset.destinationId));
  });
}

function renderTrips(trips) {
  const grid = document.querySelector('#tripsGrid');
  if (!grid) return;
  const limit = Number(grid.dataset.limit || 0);
  const visibleTrips = limit ? trips.filter((trip) => trip.featured).slice(0, limit) : trips;
  const finalTrips = visibleTrips.length ? visibleTrips : trips.slice(0, limit || trips.length);

  grid.classList.add('loaded');
  grid.innerHTML = finalTrips.length
    ? finalTrips.map((trip) => `
      <article class="trip-card">
        <div class="trip-image" style="background-image: url('${escapeAttribute(trip.imageUrl || fallbackImage(trip.destination || trip.title))}')"></div>
        <div class="trip-body">
          <span class="tag">${escapeHtml(trip.category || 'Trip')}</span>
          <h3>${escapeHtml(trip.title)}</h3>
          <p>${escapeHtml(trip.summary)}</p>
          <div class="trip-footer">
            <strong>From ${currencyFormatter.format(Number(trip.price || 0))}</strong>
            <button type="button" data-trip-id="${escapeAttribute(trip.id)}">Book Trip</button>
          </div>
          <small>${escapeHtml(trip.duration || '')} ${trip.destination ? `• ${escapeHtml(trip.destination)}` : ''}</small>
        </div>
      </article>
    `).join('')
    : '<div class="empty-state">No trips have been added yet.</div>';

  grid.querySelectorAll('[data-trip-id]').forEach((button) => {
    button.addEventListener('click', () => openTripRequestModal(button.dataset.tripId));
  });
}

function renderBlog(posts) {
  const grid = document.querySelector('#blogGrid');
  if (!grid) return;
  const limit = Number(grid.dataset.limit || 0);
  const finalPosts = limit ? posts.slice(0, limit) : posts;
  const fullLayout = grid.dataset.layout === 'full';

  grid.classList.add('loaded');
  grid.innerHTML = finalPosts.length
    ? finalPosts.map((post) => `
      <article class="blog-card ${fullLayout ? 'blog-card-full' : ''}">
        <div class="blog-image" style="background-image: url('${escapeAttribute(post.imageUrl || fallbackImage(post.title))}')"></div>
        <div class="blog-body">
          <time datetime="${escapeAttribute(post.publishedAt)}">${formatDate(post.publishedAt)}</time>
          <h3>${escapeHtml(post.title)}</h3>
          ${post.author ? `<small>By ${escapeHtml(post.author)}</small>` : ''}
          <p>${escapeHtml(fullLayout ? (post.content || post.excerpt || '') : (post.excerpt || post.content || ''))}</p>
          ${!fullLayout ? '<a class="text-link" href="blog.html">Read more</a>' : ''}
        </div>
      </article>
    `).join('')
    : '<div class="empty-state">No blog posts have been published yet.</div>';
}

function renderSocials(socials) {
  const socialContainers = [document.querySelector('#socialLinks'), document.querySelector('#footerSocialLinks')];
  socialContainers.forEach((container) => {
    if (!container) return;
    container.innerHTML = socials.length
      ? socials.map((social) => `
        <a href="${escapeAttribute(social.url)}" target="_blank" rel="noopener noreferrer">
          ${escapeHtml(social.platform)} ${social.handle ? `• ${escapeHtml(social.handle)}` : ''}
        </a>
      `).join('')
      : '<span class="admin-muted">Social media handles coming soon.</span>';
  });
}

function renderTripSelect(trips) {
  const options = '<option value="">Select a trip or leave blank</option>' + trips.map((trip) => `
    <option value="${escapeAttribute(trip.title)}" data-trip-id="${escapeAttribute(trip.id || '')}" data-destination="${escapeAttribute(trip.destination || '')}" data-days="${Number(trip.days || parseDays(trip.duration) || 1)}">${escapeHtml(trip.title)}</option>
  `).join('') + '<option value="Custom Trip">Custom Trip</option>';

  if (tripSelect) tripSelect.innerHTML = options;
  if (modalTrip) modalTrip.innerHTML = '<option value="">Any suitable trip</option>' + trips.map((trip) => `
    <option value="${escapeAttribute(trip.title)}" data-trip-id="${escapeAttribute(trip.id || '')}" data-destination="${escapeAttribute(trip.destination || '')}" data-days="${Number(trip.days || parseDays(trip.duration) || 1)}">${escapeHtml(trip.title)}</option>
  `).join('');
}

function renderDestinationSelect(destinations) {
  if (!destinationSelect) return;
  destinationSelect.innerHTML = '<option value="">Select a destination</option>' + destinations.map((destination) => `
    <option value="${escapeAttribute(destination.name)}">${escapeHtml(destination.name)}</option>
  `).join('') + '<option value="Custom Destination">Custom Destination</option>';
}

function renderFeaturedTrip(trips) {
  const featuredTrip = trips.find((trip) => trip.featured) || trips[0];
  if (!featuredTrip) return;
  const title = document.querySelector('#featuredTripTitle');
  const meta = document.querySelector('#featuredTripMeta');
  if (title) title.textContent = featuredTrip.title;
  if (meta) meta.textContent = `${featuredTrip.duration || 'Flexible'} • from ${currencyFormatter.format(Number(featuredTrip.price || 0))}`;
}

function openDestinationModal(destinationId) {
  const destination = state.destinations.find((item) => item.id === destinationId);
  if (!destination || !requestModal || !destinationRequestForm) return;

  destinationRequestForm.reset();
  document.querySelector('#requestModalTitle').textContent = `Plan ${destination.name}`;
  document.querySelector('#requestModalSummary').textContent = `${destination.region || 'Destination'} — ${destination.summary || 'Tell us what you need and our team will help.'}`;
  document.querySelector('#modalDestination').value = destination.name;
  if (modalFormMessage) modalFormMessage.textContent = '';

  if (modalTrip) {
    const matchingTrips = state.trips.filter((trip) => normalizeText(trip.destination) === normalizeText(destination.name));
    const tripOptions = matchingTrips.length ? matchingTrips : state.trips;
    modalTrip.innerHTML = '<option value="">Any suitable trip</option>' + tripOptions.map((trip) => `
      <option value="${escapeAttribute(trip.title)}" data-trip-id="${escapeAttribute(trip.id || '')}" data-days="${Number(trip.days || parseDays(trip.duration) || 1)}">${escapeHtml(trip.title)}${trip.destination ? ` — ${escapeHtml(trip.destination)}` : ''}</option>
    `).join('');
  }

  requestModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.querySelector('#modalFullName')?.focus();
}


function openTripRequestModal(tripId) {
  const trip = state.trips.find((item) => item.id === tripId);
  if (!trip) return;

  if (!requestModal || !destinationRequestForm) {
    window.location.href = `contact.html?trip=${encodeURIComponent(trip.title)}`;
    return;
  }

  destinationRequestForm.reset();
  document.querySelector('#requestModalTitle').textContent = `Book ${trip.title}`;
  document.querySelector('#requestModalSummary').textContent = `${trip.duration || 'Flexible dates'} • ${trip.destination || 'Custom destination'} • from ${currencyFormatter.format(Number(trip.price || 0))}. Tell us your dates, group size, and preferred travel style.`;
  document.querySelector('#modalDestination').value = trip.destination || 'Custom Destination';
  const modalRequestType = document.querySelector('#modalRequestType');
  if (modalRequestType) modalRequestType.value = 'booking';
  const modalDays = document.querySelector('#modalDays');
  if (modalDays) modalDays.value = trip.days || parseDays(trip.duration) || 1;
  if (modalFormMessage) modalFormMessage.textContent = '';

  if (modalTrip) {
    modalTrip.innerHTML = '<option value="">Any suitable trip</option>' + state.trips.map((item) => `
      <option value="${escapeAttribute(item.title)}" data-trip-id="${escapeAttribute(item.id || '')}" data-destination="${escapeAttribute(item.destination || '')}" data-days="${Number(item.days || parseDays(item.duration) || 1)}">${escapeHtml(item.title)}</option>
    `).join('') + '<option value="Custom Trip">Custom Trip</option>';
    modalTrip.value = trip.title;
  }

  requestModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.querySelector('#modalFullName')?.focus();
  trackMarketingEvent('select_trip', { trip: trip.title, destination: trip.destination || '' });
}

function openCustomRequestModal() {
  if (!requestModal || !destinationRequestForm) {
    window.location.href = 'contact.html';
    return;
  }

  destinationRequestForm.reset();
  document.querySelector('#requestModalTitle').textContent = 'Request a Custom Trip';
  document.querySelector('#requestModalSummary').textContent = 'Tell Explore Bloom & Beyond your destination, preferred number of days, nationality, travel date, group size, and the experience you want.';
  document.querySelector('#modalDestination').value = 'Custom Destination';
  const modalRequestType = document.querySelector('#modalRequestType');
  if (modalRequestType) modalRequestType.value = 'inquiry';
  if (modalFormMessage) modalFormMessage.textContent = '';
  if (modalTrip) {
    modalTrip.innerHTML = '<option value="Custom Trip">Custom Trip</option>' + state.trips.map((trip) => `
      <option value="${escapeAttribute(trip.title)}" data-trip-id="${escapeAttribute(trip.id || '')}" data-destination="${escapeAttribute(trip.destination || '')}" data-days="${Number(trip.days || parseDays(trip.duration) || 1)}">${escapeHtml(trip.title)}</option>
    `).join('');
    modalTrip.value = 'Custom Trip';
  }
  requestModal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  document.querySelector('#modalFullName')?.focus();
  trackMarketingEvent('custom_trip_request_opened');
}

function closeDestinationModal() {
  requestModal?.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

modalTrip?.addEventListener('change', () => {
  const selected = modalTrip.selectedOptions[0];
  const days = selected?.dataset.days;
  const destination = selected?.dataset.destination;
  if (days) document.querySelector('#modalDays').value = days;
  if (destination) document.querySelector('#modalDestination').value = destination;
});

tripSelect?.addEventListener('change', () => {
  const selected = tripSelect.selectedOptions[0];
  const destination = selected?.dataset.destination;
  const days = selected?.dataset.days;
  if (destinationSelect && destination) destinationSelect.value = destination;
  const daysInput = document.querySelector('#days');
  if (daysInput && days) daysInput.value = days;
});

async function submitBooking(event) {
  event.preventDefault();
  const booking = getFormPayload(bookingForm);

  if (!booking.fullName || !booking.email || !booking.phone || !booking.nationality || !booking.destination) {
    showMessage(formMessage, 'Please complete your name, email, phone, nationality, and destination.', 'error');
    return;
  }

  await saveTravelRequest(booking, formMessage, () => {
    bookingForm.reset();
    if (startDate) startDate.min = today;
  });
}

async function submitDestinationRequest(event) {
  event.preventDefault();
  const request = getFormPayload(destinationRequestForm);

  if (!request.fullName || !request.email || !request.phone || !request.nationality || !request.destination) {
    showMessage(modalFormMessage, 'Please complete your contact details and nationality.', 'error');
    return;
  }

  await saveTravelRequest(request, modalFormMessage, () => {
    destinationRequestForm.reset();
    setTimeout(closeDestinationModal, 900);
  });
}

async function saveTravelRequest(payload, messageElement, onSuccess) {
  const request = {
    ...payload,
    travelers: Number(payload.travelers || 1),
    days: Number(payload.days || 1)
  };

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Request API unavailable');
    }
    const saved = await response.json();
    showMessage(messageElement, saved.notice || `Request ${saved.reference || ''} was received.`, 'success');
    trackMarketingEvent('generate_lead', {
      request_type: request.requestType || 'travel',
      destination: request.destination || '',
      trip: request.trip || '',
      travelers: request.travelers,
      days: request.days
    });
    trackGoogleAdsConversion(Number(request.travelers || 1));
    onSuccess?.();
  } catch (error) {
    showMessage(messageElement, error.message || 'The request could not be sent. Please try again.', 'error');
  }
}

function openSupportPanel() {
  supportPanel?.classList.remove('hidden');
  trackMarketingEvent('open_support_chat');
  document.querySelector('#supportMessage')?.focus();
  if (state.activeChatId) {
    refreshChat();
    startSupportPolling();
  } else {
    renderChatPlaceholder();
  }
}

function closeSupportPanel() {
  supportPanel?.classList.add('hidden');
  stopSupportPolling();
}

async function submitSupportMessage(event) {
  event.preventDefault();
  const formData = new FormData(supportForm);
  const message = String(formData.get('message') || '').trim();
  if (!message) return;

  try {
    if (!state.activeChatId) {
      const name = String(formData.get('name') || '').trim();
      const email = String(formData.get('email') || '').trim();
      if (!name) {
        showMessage(supportStatus, 'Please enter your name to start chat.', 'error');
        return;
      }
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      if (!response.ok) throw new Error('Could not start chat');
      const chat = await response.json();
      state.activeChatId = chat.id;
      localStorage.setItem('safariskyChatId', chat.id);
      renderChat(chat);
      supportForm.reset();
      showMessage(supportStatus, 'Message sent. Admin support will reply here.', 'success');
      trackMarketingEvent('chat_start');
      startSupportPolling();
      return;
    }

    const response = await fetch(`/api/chats/${encodeURIComponent(state.activeChatId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!response.ok) throw new Error('Could not send message');
    supportForm.reset();
    await refreshChat();
    showMessage(supportStatus, 'Message sent.', 'success');
  } catch (error) {
    showMessage(supportStatus, 'Support chat needs the backend running. Please try again after starting the server.', 'error');
  }
}

async function refreshChat() {
  if (!state.activeChatId) return;
  try {
    const response = await fetch(`/api/chats/${encodeURIComponent(state.activeChatId)}`);
    if (!response.ok) throw new Error('Chat not found');
    const chat = await response.json();
    renderChat(chat);
  } catch (error) {
    localStorage.removeItem('safariskyChatId');
    state.activeChatId = '';
    renderChatPlaceholder();
  }
}

function startSupportPolling() {
  stopSupportPolling();
  state.supportTimer = window.setInterval(refreshChat, 7000);
}

function stopSupportPolling() {
  if (state.supportTimer) window.clearInterval(state.supportTimer);
  state.supportTimer = null;
}

function renderChat(chat) {
  if (!supportMessages) return;
  if (supportIdentityFields) supportIdentityFields.classList.add('hidden');
  supportMessages.innerHTML = (chat.messages || []).map((message) => `
    <div class="chat-bubble ${message.sender === 'admin' ? 'from-admin' : 'from-visitor'}">
      <span>${message.sender === 'admin' ? 'Support' : 'You'}</span>
      <p>${escapeHtml(message.text)}</p>
      <small>${formatDateTime(message.createdAt)}</small>
    </div>
  `).join('') || '<p class="admin-muted">Start the conversation with customer care.</p>';
  supportMessages.scrollTop = supportMessages.scrollHeight;
}

function renderChatPlaceholder() {
  if (!supportMessages) return;
  if (supportIdentityFields) supportIdentityFields.classList.remove('hidden');
  supportMessages.innerHTML = '<p class="admin-muted">Send a message and admin support will reply here.</p>';
}


function initHeroSlider() {
  const slider = document.querySelector('.hero-slider');
  if (!slider) return;

  const slides = [...slider.querySelectorAll('[data-slide]')];
  const dots = [...slider.querySelectorAll('[data-slide-to]')];
  const previous = slider.querySelector('.slider-prev');
  const next = slider.querySelector('.slider-next');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeIndex = 0;
  let timer = null;

  const showSlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === activeIndex;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
    });
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === activeIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const start = () => {
    stop();
    if (!reduceMotion && slides.length > 1) {
      timer = window.setInterval(() => showSlide(activeIndex + 1), 6500);
    }
  };

  previous?.addEventListener('click', () => { showSlide(activeIndex - 1); start(); });
  next?.addEventListener('click', () => { showSlide(activeIndex + 1); start(); });
  dots.forEach((dot) => dot.addEventListener('click', () => {
    showSlide(Number(dot.dataset.slideTo || 0));
    start();
  }));

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  slider.addEventListener('focusin', stop);
  slider.addEventListener('focusout', start);

  showSlide(0);
  start();
}

function initMarketing() {
  const tagIds = [MARKETING_CONFIG.googleAnalyticsId, MARKETING_CONFIG.googleAdsId]
    .filter((id) => isRealMarketingId(id));

  if (!tagIds.length) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());

  tagIds.forEach((id) => window.gtag('config', id));

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(tagIds[0])}`;
  document.head.appendChild(script);
}

function isRealMarketingId(id = '') {
  const value = String(id).trim();
  return /^(G|AW)-[A-Z0-9]+$/i.test(value) && !value.includes('XXXX');
}

function trackMarketingEvent(eventName, params = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

function trackGoogleAdsConversion(value = 1) {
  if (typeof window.gtag !== 'function') return;
  const adsId = MARKETING_CONFIG.googleAdsId;
  const label = MARKETING_CONFIG.googleAdsConversionLabel;
  if (!isRealMarketingId(adsId) || !label || label.includes('REPLACE')) return;
  window.gtag('event', 'conversion', {
    send_to: `${adsId}/${label}`,
    value,
    currency: 'USD'
  });
}

function getFormPayload(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  const tripField = form?.querySelector('select[name="trip"]');
  const selected = tripField?.selectedOptions?.[0];
  if (selected?.dataset?.tripId) payload.tripId = selected.dataset.tripId;
  return payload;
}

async function initAccountNavigation() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) return;
    const { user } = await response.json();
    const accountLinks = document.querySelectorAll('.nav-admin');
    accountLinks.forEach((link) => {
      link.href = user ? (user.role === 'customer' ? 'dashboard.html' : 'admin.html') : 'login.html';
      link.textContent = user ? (user.role === 'customer' ? 'Dashboard' : 'Admin') : 'Login';
    });
    if (!user) return;
    const fieldMap = {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      nationality: user.nationality,
      name: user.fullName
    };
    document.querySelectorAll('form').forEach((form) => {
      Object.entries(fieldMap).forEach(([name, value]) => {
        const input = form.elements?.namedItem(name);
        if (input && !input.value && value) input.value = value;
      });
    });
  } catch (error) {
    // The public website still works if account services are temporarily unavailable.
  }
}

function showMessage(element, text, type) {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`;
}

function formatDate(dateValue) {
  if (!dateValue) return 'Travel guide';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function parseDays(duration = '') {
  const match = String(duration).match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function fallbackImage(seed = 'travel') {
  const options = [
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=900&q=80'
  ];
  const index = Math.abs(String(seed).split('').reduce((total, char) => total + char.charCodeAt(0), 0)) % options.length;
  return options[index];
}

function normalizeText(value = '') {
  return String(value).trim().toLowerCase();
}

function escapeHtml(value = '') {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttribute(value = '') {
  return escapeHtml(value).replaceAll('`', '&#096;');
}
