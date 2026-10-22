<script setup lang="ts">
import type { Catalog } from "../../shared/types";
import {
  ArrowRightIcon,
  LeafIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "@lucide/vue";

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
const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-7 rounded-[5px] bg-green px-[21px] py-3.5 text-xs font-semibold text-white hover:bg-[#29442d]";
const categoryLink =
  "flex items-center justify-between gap-2 rounded px-3 py-[11px] text-xs leading-[1.4] hover:bg-[#f0f1e9] [&>span:last-child]:text-[10px] [&>span:last-child]:text-[#8b9184]";
const gridClass =
  "grid grid-cols-3 gap-x-5 gap-y-[29px] transition-opacity min-[1450px]:grid-cols-4 max-[1000px]:grid-cols-2 max-[680px]:gap-x-3 max-[680px]:gap-y-[25px]";
const pageLink = "grid size-[37px] place-items-center rounded border text-xs";
const wrap =
  "mx-auto max-w-[1360px] px-12 min-[1450px]:max-w-[1500px] max-[1000px]:px-7 max-[680px]:px-5";
</script>
<template>
  <main id="main">
    <section
      :class="[
        wrap,
        'grid min-h-[430px] grid-cols-[1.03fr_1fr] gap-[50px] pb-9 pt-3 max-[1000px]:gap-6 max-[680px]:grid-cols-1 max-[680px]:pb-[27px] max-[680px]:pt-0',
      ]"
      aria-labelledby="hero-heading"
    >
      <div class="pt-[34px] max-[680px]:pt-[15px]">
        <h1
          id="hero-heading"
          class="mb-6 mt-[27px] text-[clamp(44px,4.6vw,66px)] font-semibold leading-[1.1] tracking-[-3px] max-[1000px]:text-[49px] max-[680px]:my-5"
        >
          Geras maistas.<br /><em class="font-serif font-normal text-[#61754e]"
            >Arčiau jūsų.</em
          >
        </h1>
        <p
          class="mb-[27px] text-sm leading-[1.9] text-muted max-[680px]:text-[13px]"
        >
          Nuo daržo gėrybių iki kasdienio duonos kąsnio.<br
            class="max-[680px]:hidden"
          />Atraskite skonius, kuriems norisi palikti vietos ant stalo.
        </p>
        <a :class="primaryButton" href="#katalogas"
          >Atrasti produktus <ArrowRightIcon :stroke-width="1.6"
        /></a>
      </div>
      <div
        class="relative min-h-[380px] overflow-hidden rounded-[6px_60px_6px_6px] bg-[#e4decf] after:absolute after:inset-x-0 after:bottom-0 after:top-1/2 after:bg-gradient-to-b after:from-transparent after:to-[#16291d99] after:content-[''] max-[1000px]:min-h-[370px] max-[680px]:min-h-[250px] max-[680px]:rounded-[5px_50px_5px_5px] [&>img]:absolute [&>img]:size-full [&>img]:object-cover [&>img]:brightness-[.85] [&>img]:saturate-[.85]"
      >
        <ProductImage
          :src="heroImage"
          alt="Šviežios morkos su žemėmis — šio sezono derlius"
          eager
        />
        <div
          class="absolute right-6 top-6 z-[1] flex size-[99px] rotate-[10deg] flex-col items-center justify-center gap-[5px] rounded-full bg-[#f5f1df] text-center text-[11px] max-[680px]:right-[18px] max-[680px]:top-4 max-[680px]:size-20"
        >
          <LeafIcon :size="26" :stroke-width="1.6" /><span
            >Įkvėpta<br /><strong class="font-serif text-xl font-normal"
              >gamtos</strong
            ></span
          >
        </div>
        <div
          class="absolute bottom-[25px] left-7 z-[1] flex flex-col gap-2 text-white max-[680px]:bottom-5 max-[680px]:left-[21px]"
        >
          <span class="text-[9px] tracking-[2px]">SEZONO ATRADIMAI</span
          ><strong
            class="font-serif text-[23px] font-normal max-[680px]:text-xl"
            >Paprastume — visas skonis.</strong
          >
        </div>
      </div>
    </section>
    <section
      id="katalogas"
      :class="[wrap, 'scroll-mt-5 pb-[60px] pt-14 max-[680px]:pt-[35px]']"
      aria-labelledby="catalog-title"
    >
      <div
        class="mb-[35px] flex items-center justify-between gap-[25px] max-[680px]:mb-[22px]"
      >
        <div>
          <h2
            id="catalog-title"
            class="text-[32px] font-semibold tracking-[-1.2px] max-[680px]:text-[28px]"
          >
            Krautuvės gėrybės<span
              v-if="data"
              class="ml-3 inline-block rounded-[20px] bg-[#e8ecdf] px-2.5 py-[5px] align-middle font-sans text-[11px] font-medium tracking-normal"
              >{{ data.total }}</span
            >
          </h2>
        </div>
      </div>
      <div
        class="grid grid-cols-[215px_1fr] gap-[38px] min-[1450px]:grid-cols-[220px_1fr] max-[1000px]:grid-cols-[180px_1fr] max-[1000px]:gap-[25px] max-[680px]:grid-cols-1 max-[680px]:gap-0"
      >
        <aside
          :class="
            mobileFilters
              ? 'max-[680px]:mb-5 max-[680px]:rounded-md max-[680px]:border max-[680px]:border-line max-[680px]:bg-[#f4f5ed] max-[680px]:p-[17px]'
              : 'max-[680px]:hidden'
          "
          aria-label="Kategorijų filtrai"
        >
          <div class="flex items-center justify-between">
            <h3 class="mb-[17px] text-sm">Kategorijos</h3>
            <button
              class="hidden bg-transparent p-2 max-[680px]:flex"
              aria-label="Uždaryti filtrus"
              @click="mobileFilters = false"
            >
              <XIcon :stroke-width="1.6" />
            </button>
          </div>
          <UiInputGroup class="mb-[13px] bg-white">
            <UiInputGroupInput
              v-model="categorySearch"
              placeholder="Rasti kategoriją"
              aria-label="Rasti kategoriją"
            />
            <UiInputGroupAddon>
              <SearchIcon :size="16" />
            </UiInputGroupAddon>
          </UiInputGroup>
          <nav
            class="flex max-h-[650px] flex-col gap-[3px] overflow-auto pr-[5px] [scrollbar-color:#ccd4c1_transparent] [scrollbar-width:thin] max-[680px]:max-h-[330px]"
            aria-label="Produktų kategorijos"
          >
            <NuxtLink
              :to="destination({ category: undefined, page: undefined })"
              :class="[
                categoryLink,
                !selectedCategory && 'bg-[#e9eedf] font-bold text-[#36512f]',
              ]"
              :aria-current="!selectedCategory ? 'true' : undefined"
              @click="mobileFilters = false"
              ><span>Visi produktai</span
              ><span>{{ data?.total ?? "—" }}</span></NuxtLink
            ><NuxtLink
              v-for="category in categories"
              :key="category.value"
              :to="destination({ category: category.value, page: undefined })"
              :class="[
                categoryLink,
                selectedCategory === category.value &&
                  'bg-[#e9eedf] font-bold text-[#36512f]',
              ]"
              :aria-current="
                selectedCategory === category.value ? 'true' : undefined
              "
              @click="mobileFilters = false"
              ><span>{{ category.value }}</span
              ><span>{{ category.count }}</span></NuxtLink
            >
            <p
              v-if="categorySearch && !categories.length"
              class="text-xs text-muted"
            >
              Kategorijų nerasta.
            </p>
          </nav>
        </aside>
        <div :aria-busy="status === 'pending'">
          <div
            class="mb-[22px] flex min-h-[37px] items-center justify-between gap-4 max-[1000px]:flex-wrap max-[680px]:gap-[7px]"
          >
            <button
              class="hidden min-h-[37px] items-center gap-[7px] rounded-[5px] border border-line bg-transparent px-[11px] py-2 text-[11px] font-semibold max-[680px]:flex"
              :aria-expanded="mobileFilters"
              @click="mobileFilters = !mobileFilters"
            >
              <SlidersHorizontalIcon :size="16" :stroke-width="1.6" />
              Kategorijos
            </button>
            <p
              class="text-xs text-[#747c6d] max-[680px]:order-3 max-[680px]:mt-2.5 max-[680px]:basis-full max-[680px]:text-[11px]"
              aria-live="polite"
            >
              {{ data?.count ?? 0 }} produktai
              <span v-if="selectedCategory">· {{ selectedCategory }}</span>
            </p>
            <div
              class="flex min-w-0 flex-1 items-center justify-end gap-4 max-[1000px]:basis-full max-[680px]:justify-between max-[680px]:gap-2"
            >
              <form
                class="min-w-0 flex-1 max-w-[350px]"
                role="search"
                @submit.prevent="update({ q: search.trim() || undefined })"
              >
                <UiInputGroup>
                  <UiInputGroupInput
                    v-model="search"
                    type="search"
                    aria-label="Ieškoti produktų"
                    placeholder="Ko šiandien ieškote?"
                    maxlength="120"
                  />
                  <UiInputGroupAddon>
                    <SearchIcon :size="16" />
                  </UiInputGroupAddon>
                </UiInputGroup>
              </form>
              <label
                class="flex shrink-0 items-center gap-2 whitespace-nowrap text-[11px]"
                ><span class="text-muted max-[1000px]:hidden">Rikiuoti:</span
                ><select
                  class="max-w-[190px] cursor-pointer rounded border border-line bg-transparent py-[9px] pl-[9px] pr-6 text-[11px] text-ink max-[680px]:max-w-[182px] max-[680px]:text-[10px]"
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
          </div>
          <div
            v-if="selectedCategory || route.query.q"
            class="mb-5 flex flex-wrap items-center gap-2"
          >
            <button
              v-if="selectedCategory"
              class="flex items-center gap-[9px] rounded bg-[#e9eedf] px-2.5 py-[7px] text-[11px]"
              @click="update({ category: undefined })"
            >
              {{ selectedCategory }}
              <XIcon :size="14" :stroke-width="1.6" /></button
            ><button
              v-if="route.query.q"
              class="flex items-center gap-[9px] rounded bg-[#e9eedf] px-2.5 py-[7px] text-[11px]"
              @click="update({ q: undefined })"
            >
              „{{ route.query.q }}“
              <XIcon :size="14" :stroke-width="1.6" /></button
            ><NuxtLink class="ml-2 text-[11px] underline" to="/#katalogas"
              >Išvalyti filtrus</NuxtLink
            >
          </div>
          <div
            v-if="error"
            class="rounded-md bg-[#f0f2e9] px-[25px] py-[60px] text-center"
            role="alert"
          >
            <LeafIcon class="mx-auto mb-5" :size="36" :stroke-width="1.6" />
            <h3 class="text-[23px]">Nepavyko atverti katalogo</h3>
            <p class="text-sm text-muted">
              {{
                error.statusCode === 400
                  ? "Patikrinkite puslapio adresą arba grįžkite į katalogo pradžią."
                  : "Parduotuvė trumpam nepasiekiama. Pabandykite dar kartą."
              }}
            </p>
            <button :class="primaryButton" @click="refresh()">
              Bandyti dar kartą</button
            ><NuxtLink class="mt-5 block text-xs underline" to="/#katalogas"
              >Visi produktai</NuxtLink
            >
          </div>
          <div v-else-if="status === 'pending' && !data" :class="gridClass">
            <div
              v-for="n in 6"
              :key="n"
              class="h-80 animate-shimmer rounded-md bg-[linear-gradient(110deg,#eeeee6_30%,#f8f8f3_50%,#eeeee6_70%)] bg-[length:300%_100%]"
            />
          </div>
          <div
            v-else-if="
              data && (currentPage > data.pages || !data.products.length)
            "
            class="rounded-md bg-[#f0f2e9] px-[25px] py-[60px] text-center"
          >
            <SearchIcon class="mx-auto mb-5" :size="36" :stroke-width="1.6" />
            <h3 class="text-[23px]">
              {{
                currentPage > data.pages
                  ? "Tokio puslapio nėra"
                  : "Šįkart nieko neradome"
              }}
            </h3>
            <p class="text-sm text-muted">
              Pabandykite kitą paieškos žodį arba peržiūrėkite visas gėrybes.
            </p>
            <NuxtLink :class="primaryButton" to="/#katalogas"
              >Grįžti į katalogą</NuxtLink
            >
          </div>
          <template v-else
            ><div
              :class="[
                gridClass,
                status === 'pending' && 'pointer-events-none opacity-50',
              ]"
            >
              <ProductCard
                v-for="product in data?.products"
                :key="product.id"
                :product="product"
              />
            </div>
            <nav
              v-if="data && data.pages > 1"
              class="mt-[42px] flex items-center justify-center gap-[7px]"
              aria-label="Katalogo puslapiai"
            >
              <NuxtLink
                v-if="currentPage > 1"
                :to="destination({ page: String(currentPage - 1) })"
                :class="[pageLink, 'border-line hover:bg-pale']"
                aria-label="Ankstesnis puslapis"
                >←</NuxtLink
              ><template v-for="(page, i) in pages" :key="page"
                ><span
                  v-if="i > 0 && page - pages[i - 1]! > 1"
                  class="px-1 text-muted"
                  >…</span
                ><NuxtLink
                  :to="destination({ page: String(page) })"
                  :class="[
                    pageLink,
                    currentPage === page
                      ? 'border-green bg-green text-white'
                      : 'border-line hover:bg-pale',
                  ]"
                  :aria-current="currentPage === page ? 'page' : undefined"
                  >{{ page }}</NuxtLink
                ></template
              ><NuxtLink
                v-if="currentPage < data.pages"
                :to="destination({ page: String(currentPage + 1) })"
                :class="[pageLink, 'border-line hover:bg-pale']"
                aria-label="Kitas puslapis"
                >→</NuxtLink
              >
            </nav>
            <p
              v-if="data?.products.length"
              class="mt-4 text-center text-[11px] text-muted"
            >
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
