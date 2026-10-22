<script setup lang="ts">
import type { Catalog } from "../../shared/types";
const route = useRoute();
const router = useRouter();
const query = computed(() => ({
  page: route.query.page || "1",
  q: route.query.q || "",
  category: route.query.category || "",
  sort: route.query.sort || "price-asc",
}));
const { data, error, status, refresh } = await useFetch<Catalog>(
  "/api/catalog",
  { query },
);
const search = ref(String(route.query.q || ""));
const categorySearch = ref("");
const mobileFilters = ref(false);
watch(
  () => route.query.q,
  (q) => {
    search.value = String(q || "");
  },
);
const categories = computed(() =>
  (data.value?.categories || []).filter((c) =>
    c.value
      .toLocaleLowerCase("lt")
      .includes(categorySearch.value.toLocaleLowerCase("lt")),
  ),
);
const selectedCategory = computed(() => String(route.query.category || ""));
const currentPage = computed(() => Number(route.query.page || 1));
const pages = computed(() => {
  const total = data.value?.pages || 1;
  return [
    ...new Set([
      1,
      currentPage.value - 1,
      currentPage.value,
      currentPage.value + 1,
      total,
    ]),
  ]
    .filter((n) => n > 0 && n <= total)
    .sort((a, b) => a - b);
});
function destination(changes: Record<string, string | undefined>) {
  const next = { ...route.query, ...changes };
  for (const key of Object.keys(next)) if (!next[key]) delete next[key];
  return { path: "/", query: next, hash: "#katalogas" };
}
function update(changes: Record<string, string | undefined>) {
  mobileFilters.value = false;
  return router.push(destination({ page: undefined, ...changes }));
}
const heroImage =
  "https://pilnaspuodas.lt/wp-content/uploads/2024/03/morkos-nerac-su-zememis.jpg";
useSeoMeta({ title: "Ūkio krautuvė — atraskite gerą maistą" });
</script>
<template>
  <main id="main">
    <section class="hero wrap" aria-labelledby="hero-heading">
      <div class="hero-copy">
        <h1 id="hero-heading">Geras maistas.<br /><em>Arčiau jūsų.</em></h1>
        <p class="hero-description">
          Nuo daržo gėrybių iki kasdienio duonos kąsnio.<br />Atraskite skonius,
          kuriems norisi palikti vietos ant stalo.
        </p>
        <a class="button primary" href="#katalogas"
          >Atrasti produktus <AppIcon name="arrow"
        /></a>
      </div>
      <div class="hero-visual">
        <ProductImage
          :src="heroImage"
          alt="Šviežios morkos su žemėmis — šio sezono derlius"
          eager
        />
        <div class="hero-stamp">
          <AppIcon name="leaf" :size="26" /><span
            >Įkvėpta<br /><strong>gamtos</strong></span
          >
        </div>
        <div class="hero-caption">
          <span>SEZONO ATRADIMAI</span
          ><strong>Paprastume — visas skonis.</strong>
        </div>
      </div>
    </section>
    <section
      id="katalogas"
      class="catalog wrap"
      aria-labelledby="catalog-title"
    >
      <div class="catalog-heading">
        <div>
          <h2 id="catalog-title">
            Krautuvės gėrybės<span v-if="data" class="count-pill">{{
              data.total
            }}</span>
          </h2>
        </div>
        <form
          class="search-box"
          role="search"
          @submit.prevent="update({ q: search.trim() || undefined })"
        >
          <AppIcon name="search" /><input
            v-model="search"
            type="search"
            aria-label="Ieškoti produktų"
            placeholder="Ko šiandien ieškote?"
            maxlength="120"
          /><button type="submit" aria-label="Ieškoti">
            <AppIcon name="arrow" />
          </button>
        </form>
      </div>
      <div class="catalog-layout">
        <aside
          class="filters"
          :class="{ 'filters-open': mobileFilters }"
          aria-label="Kategorijų filtrai"
        >
          <div class="filter-heading">
            <h3>Kategorijos</h3>
            <button
              class="icon-button mobile-only"
              aria-label="Uždaryti filtrus"
              @click="mobileFilters = false"
            >
              <AppIcon name="close" />
            </button>
          </div>
          <label class="category-search"
            ><AppIcon name="search" :size="16" /><input
              v-model="categorySearch"
              placeholder="Rasti kategoriją"
              aria-label="Rasti kategoriją"
          /></label>
          <nav class="category-list" aria-label="Produktų kategorijos">
            <NuxtLink
              :to="destination({ category: undefined, page: undefined })"
              :class="{ selected: !selectedCategory }"
              :aria-current="!selectedCategory ? 'true' : undefined"
              @click="mobileFilters = false"
              ><span>Visi produktai</span
              ><span>{{ data?.total ?? "—" }}</span></NuxtLink
            ><NuxtLink
              v-for="category in categories"
              :key="category.value"
              :to="destination({ category: category.value, page: undefined })"
              :class="{ selected: selectedCategory === category.value }"
              :aria-current="
                selectedCategory === category.value ? 'true' : undefined
              "
              @click="mobileFilters = false"
              ><span>{{ category.value }}</span
              ><span>{{ category.count }}</span></NuxtLink
            >
            <p v-if="categorySearch && !categories.length" class="muted">
              Kategorijų nerasta.
            </p>
          </nav>
        </aside>
        <div class="catalog-results" :aria-busy="status === 'pending'">
          <div class="results-toolbar">
            <button
              class="button filter-toggle"
              :aria-expanded="mobileFilters"
              @click="mobileFilters = !mobileFilters"
            >
              <AppIcon name="filter" /> Kategorijos
            </button>
            <p aria-live="polite">
              {{ data?.count ?? 0 }} produktai
              <span v-if="selectedCategory">· {{ selectedCategory }}</span>
            </p>
            <label class="sort-label"
              ><span>Rikiuoti:</span
              ><select
                :value="query.sort"
                aria-label="Rikiuoti pagal kainą"
                @change="
                  update({ sort: ($event.target as HTMLSelectElement).value })
                "
              >
                <option value="price-asc">Kaina: nuo mažiausios</option>
                <option value="price-desc">Kaina: nuo didžiausios</option>
              </select></label
            >
          </div>
          <div v-if="selectedCategory || route.query.q" class="active-filters">
            <button
              v-if="selectedCategory"
              @click="update({ category: undefined })"
            >
              {{ selectedCategory }} <AppIcon name="close" :size="14" /></button
            ><button v-if="route.query.q" @click="update({ q: undefined })">
              „{{ route.query.q }}“ <AppIcon name="close" :size="14" /></button
            ><NuxtLink to="/#katalogas">Išvalyti filtrus</NuxtLink>
          </div>
          <div v-if="error" class="state-panel" role="alert">
            <AppIcon name="leaf" :size="36" />
            <h3>Nepavyko atverti katalogo</h3>
            <p>
              {{
                error.statusCode === 400
                  ? "Patikrinkite puslapio adresą arba grįžkite į katalogo pradžią."
                  : "Parduotuvė trumpam nepasiekiama. Pabandykite dar kartą."
              }}
            </p>
            <button class="button primary" @click="refresh()">
              Bandyti dar kartą</button
            ><NuxtLink to="/#katalogas">Visi produktai</NuxtLink>
          </div>
          <div v-else-if="status === 'pending' && !data" class="product-grid">
            <div v-for="n in 6" :key="n" class="skeleton" />
          </div>
          <div
            v-else-if="
              data && (currentPage > data.pages || !data.products.length)
            "
            class="state-panel"
          >
            <AppIcon name="search" :size="36" />
            <h3>
              {{
                currentPage > data.pages
                  ? "Tokio puslapio nėra"
                  : "Šįkart nieko neradome"
              }}
            </h3>
            <p>
              Pabandykite kitą paieškos žodį arba peržiūrėkite visas gėrybes.
            </p>
            <NuxtLink class="button primary" to="/#katalogas"
              >Grįžti į katalogą</NuxtLink
            >
          </div>
          <template v-else
            ><div
              class="product-grid"
              :class="{ loading: status === 'pending' }"
            >
              <ProductCard
                v-for="product in data?.products"
                :key="product.id"
                :product="product"
              />
            </div>
            <nav
              v-if="data && data.pages > 1"
              class="pagination"
              aria-label="Katalogo puslapiai"
            >
              <NuxtLink
                v-if="currentPage > 1"
                :to="destination({ page: String(currentPage - 1) })"
                aria-label="Ankstesnis puslapis"
                >←</NuxtLink
              ><template v-for="(page, i) in pages" :key="page"
                ><span v-if="i > 0 && page - pages[i - 1]! > 1" class="ellipsis"
                  >…</span
                ><NuxtLink
                  :to="destination({ page: String(page) })"
                  :class="{ current: currentPage === page }"
                  :aria-current="currentPage === page ? 'page' : undefined"
                  >{{ page }}</NuxtLink
                ></template
              ><NuxtLink
                v-if="currentPage < data.pages"
                :to="destination({ page: String(currentPage + 1) })"
                aria-label="Kitas puslapis"
                >→</NuxtLink
              >
            </nav>
            <p v-if="data?.products.length" class="page-caption">
              Rodoma {{ (currentPage - 1) * 24 + 1 }}–{{
                Math.min(currentPage * 24, data.count)
              }}
              iš {{ data.count }} produktų
            </p></template
          >
        </div>
      </div>
    </section>
  </main>
</template>
