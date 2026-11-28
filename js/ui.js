/**
 * Dil Analizi - Kullanıcı Arayüzü Modülü (ui.js)
 * DOM manipülasyonu, sekmeler, modal pencereler, bildirimler ve Chart.js grafikleri
 */

export class UIController {
  constructor() {
    this.charts = {};
  }

  /**
   * Bildirim (Toast) göster
   */
  showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-body">
        <span>${message}</span>
        <button type="button" class="toast-close" aria-label="Kapat">&times;</button>
      </div>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add("toast-fade-out");
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }

  /**
   * Kaynak Makale Detay Modalı Aç
   */
  openCitationModal(paperKey) {
    const citations = {
      heilmann2010: {
        title: "Heilmann, Nockerts & Miller (2010)",
        fullRef: "Heilmann, J., Nockerts, A., & Miller, J. F. (2010). Language Sampling: Does the Length of the Transcript Matter? Language, Speech, and Hearing Services in Schools, 41(4), 393–404.",
        points: [
          "Örnek Uzunluğu: 1, 3 ve 7 dakikalık dil örneklerinin güvenilirliği 231 tipik gelişim gösteren çocukta (2;8-13;3 yaş) incelenmiştir.",
          "Temel Bulgu: Örnek uzunluğunun ölçütler üzerindeki ana etkisi anlamlı bulunmamıştır (tüm η² < .01).",
          "Güvenilirlik: NTU, WPM ve NDW 1 dakikada bile güvenilirdir (α > 0.70); MLUm 3 dakikada orta-iyi kararlılık gösterir (α ≈ 0.72).",
          "Kısıtlılıklar: Labirent yüzdesi ve dilbilgisel hatalar kısa örneklerde çok yüksek varyasyon katsayısına sahiptir ve güvenilmezdir (α < 0.60).",
          "Klinik Çıkarım: Kısa örnekler genel tarama ve ilerleme izleme için uygundur; fakat detaylı morfem ve labirent profili için geleneksel ≥50 ifade toplanmalıdır."
        ]
      },
      westerveld2014: {
        title: "Westerveld & Claessen (2014)",
        fullRef: "Westerveld, M. F., & Claessen, M. (2014). Clinician survey of language sampling practices in Australia. International Journal of Speech-Language Pathology, 16(3), 242–249.",
        points: [
          "Örneklem: Avustralya'da çalışan 257 konuşma ve dil terapisti ankete katılmıştır.",
          "Uygulama Oranı: Klinisyenlerin %91'i spontan dil örneği toplamakta, %87'si gayri resmi yöntemler kullanmaktadır.",
          "Kayıt ve Analiz: Yalnızca %56'sı ses kaydı almakta, %12,5'i bilgisayar destekli analiz (SALT vb.) kullanmaktadır.",
          "Tipik Örnek Boyutu: Klinisyenlerin pratikte topladığı örneklerin ortalama uzunluğu 16-23 ifade civarındadır (sohbet 23.3, anlatı 16.6).",
          "En Büyük Engel: Klinisyenlerin %80'den fazlası transkripsiyon ve analiz SÜRESİNİ başlıca engel olarak belirtmiştir; %57'si güvenilir bir analiz hizmetini/aracını tercih edeceğini bildirmiştir."
        ]
      },
      ozdemir2010: {
        title: "Özdemir (2010)",
        fullRef: "Özdemir, M. (2010). Nitel Veri Analizi: Sosyal Bilimlerde Yöntembilim Sorunsalı Üzerine Bir Çalışma. Eskişehir Osmangazi Üniversitesi Sosyal Bilimler Dergisi, 11(1), 323–343.",
        points: [
          "Ortak Süreç Modeli: Veri → Analiz Birimi → Kodlama → Kategori → Tema → Denence/Rapor aşamalı sentezi sunulmuştur.",
          "Kuramsal Temeller: Miles & Huberman (veri azaltma-görselleştirme-sonuca ulaşma), Dey (betimleme-sınıflandırma-ilişkilendirme) ve Strauss & Corbin (açık, eksenel, seçici kodlama) yaklaşımları birleştirilmiştir.",
          "Analiz Türleri: İçerik analizi, betimsel analiz ve sabit karşılaştırmalı analizin farkları ve uygulama adımları belirlenmiştir.",
          "Geçerlik & Güvenilirlik: İç geçerliğin doğrudan alıntılarla kanıtlanması ve araştırmacılar arası tutarlılık uzlaşma formülü ([Uzlaşma / (Uzlaşma + Ayrılık)] × 100) vurgulanmıştır."
        ]
      }
    };

    const cit = citations[paperKey];
    if (!cit) return;

    let modal = document.getElementById("citation-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "citation-modal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <h3 id="modal-title" class="modal-title">${cit.title}</h3>
          <button type="button" class="modal-close" aria-label="Kapat">&times;</button>
        </div>
        <div class="modal-body">
          <p class="citation-reference"><strong>Tam Kaynakça:</strong><br><em>${cit.fullRef}</em></p>
          <hr class="modal-divider">
          <h4>Temel Metodolojik Bulgular:</h4>
          <ul class="citation-bullets">
            ${cit.points.map(p => `<li>${p}</li>`).join("")}
          </ul>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary modal-close-btn">Kapat</button>
        </div>
      </div>
    `;

    modal.classList.add("modal-open");

    const closeHandler = () => {
      modal.classList.remove("modal-open");
    };

    modal.querySelector(".modal-close").addEventListener("click", closeHandler);
    modal.querySelector(".modal-close-btn").addEventListener("click", closeHandler);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeHandler();
    });
  }

  /**
   * Sekme Geçişi
   */
  switchTab(targetTabId) {
    const validTabs = ["ozet", "bicimbilim", "sozcuk", "soylem", "nitel", "klinik"];
    const activeTab = validTabs.includes(targetTabId) ? targetTabId : "ozet";

    // Sekme butonlarını güncelle
    document.querySelectorAll(".tab-btn").forEach(btn => {
      const isTarget = btn.getAttribute("data-tab") === activeTab;
      btn.classList.toggle("active", isTarget);
      btn.setAttribute("aria-selected", isTarget ? "true" : "false");
    });

    // Sekme içerik panellerini güncelle
    document.querySelectorAll(".tab-pane").forEach(pane => {
      const isTarget = pane.id === `tab-${activeTab}`;
      pane.classList.toggle("active", isTarget);
    });

    // Hash güncelle
    if (window.location.hash !== `#${activeTab}`) {
      window.location.hash = activeTab;
    }
  }

  /**
   * Chart.js nesnesini güvenle temizle ve yeniden oluştur
   */
  renderChart(canvasId, config) {
    if (typeof Chart === "undefined") {
      console.warn("Chart.js yüklenemedi; grafik çizilemedi:", canvasId);
      return null;
    }

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
      delete this.charts[canvasId];
    }

    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    try {
      const chartInstance = new Chart(canvas, config);
      this.charts[canvasId] = chartInstance;
      return chartInstance;
    } catch (e) {
      console.error(`Grafik oluşturulurken hata (${canvasId}):`, e);
      return null;
    }
  }

  /**
   * Ek Frekans Çubuk Grafiği (Tab 2)
   */
  renderAffixChart(affixCounts) {
    const sorted = Object.entries(affixCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const labels = sorted.map(s => s[0]);
    const data = sorted.map(s => s[1]);

    this.renderChart("chart-affixes", {
      type: "bar",
      data: {
        labels: labels.length > 0 ? labels : ["Ek Bulunamadı"],
        datasets: [{
          label: "Ek Sayısı (Frekans)",
          data: data.length > 0 ? data : [0],
          backgroundColor: "#319795",
          borderColor: "#234e52",
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } }
        }
      }
    });
  }

  /**
   * LARSP Yapısal Dağılım Grafiği (Tab 2)
   */
  renderLarspChart(larsp) {
    const labels = ["Tek Sözcük", "2 Öğe", "3 Öğe", "4+ Öğe", "Bileşik/Karmaşık"];
    const data = [
      larsp.singleWord.count,
      larsp.twoElements.count,
      larsp.threeElements.count,
      larsp.fourPlusElements.count,
      larsp.complexClause.count
    ];

    this.renderChart("chart-larsp", {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            "#cbd5e0",
            "#63b3ed",
            "#4299e1",
            "#3182ce",
            "#2b6cb0"
          ],
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 14, font: { size: 11 } } }
        }
      }
    });
  }

  /**
   * Sözcük Türü (POS) Dağılım Grafiği (Tab 3)
   */
  renderPosChart(posCounts) {
    const labels = ["İsim", "Fiil", "Sıfat", "Zarf", "Zamir", "Bağlaç", "Edat/Ünlem", "Sayı", "Diğer"];
    const data = [
      posCounts.noun || 0,
      posCounts.verb || 0,
      posCounts.adj || 0,
      posCounts.adv || 0,
      posCounts.pron || 0,
      posCounts.conj || 0,
      (posCounts.prep || 0) + (posCounts.interj || 0),
      posCounts.num || 0,
      (posCounts.unknown || 0) + (posCounts.maze || 0)
    ];

    this.renderChart("chart-pos", {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            "#319795",
            "#e53e3e",
            "#d69e2e",
            "#805ad5",
            "#3182ce",
            "#dd6b20",
            "#38a169",
            "#d53f8c",
            "#a0aec0"
          ],
          borderWidth: 2,
          borderColor: "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "right", labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }

  /**
   * Nitel Kod Frekans Grafiği (Tab 5)
   */
  renderQualitativeChart(codeFreqs) {
    const top = codeFreqs.slice(0, 8);
    const labels = top.map(c => c.code.name);
    const data = top.map(c => c.count);
    const colors = top.map(c => c.code.color || "#319795");

    this.renderChart("chart-qual-codes", {
      type: "bar",
      data: {
        labels: labels.length > 0 ? labels : ["Kod Yok"],
        datasets: [{
          label: "İfade Frekansı",
          data: data.length > 0 ? data : [0],
          backgroundColor: colors.length > 0 ? colors : ["#cbd5e0"],
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  /**
   * İlerleme İzleme Çoklu Oturum Çizgi Grafiği (Tab 6)
   */
  renderLongitudinalChart(sessions) {
    if (!sessions || sessions.length === 0) {
      this.renderChart("chart-longitudinal", {
        type: "line",
        data: { labels: ["Oturum Yok"], datasets: [] },
        options: { responsive: true, maintainAspectRatio: false }
      });
      return;
    }

    const labels = sessions.map(s => `${s.date} (${s.context})`);
    const ntuData = sessions.map(s => s.metrics.ntu);
    const ndwData = sessions.map(s => s.metrics.ndw);
    const mlumData = sessions.map(s => s.metrics.mlum);
    const wpmData = sessions.map(s => s.metrics.wpm || null);

    this.renderChart("chart-longitudinal", {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "NTU (İfade Sayısı)",
            data: ntuData,
            borderColor: "#319795",
            backgroundColor: "rgba(49, 151, 149, 0.1)",
            tension: 0.2,
            fill: false
          },
          {
            label: "NDW (Farklı Sözcük)",
            data: ndwData,
            borderColor: "#3182ce",
            backgroundColor: "rgba(49, 130, 206, 0.1)",
            tension: 0.2,
            fill: false
          },
          {
            label: "MLUm (Morfem/İfade)",
            data: mlumData,
            borderColor: "#805ad5",
            backgroundColor: "rgba(128, 90, 213, 0.1)",
            tension: 0.2,
            fill: false,
            yAxisID: "y1"
          },
          {
            label: "WPM (Hız)",
            data: wpmData,
            borderColor: "#dd6b20",
            backgroundColor: "rgba(221, 107, 32, 0.1)",
            tension: 0.2,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: { mode: "index", intersect: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Sayı / Hız" }
          },
          y1: {
            position: "right",
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            title: { display: true, text: "MLUm" }
          }
        }
      }
    });
  }

  /**
   * Yaşa Göre Önerilen Bağlam Grafiği (Tab 6)
   */
  renderAgeContextChart() {
    this.renderChart("chart-age-context", {
      type: "bar",
      data: {
        labels: ["< 4 Yaş", "4;0 - 5;11 Yaş", "6;0 - 11;11 Yaş", "12+ Yaş (Lise)"],
        datasets: [
          {
            label: "Serbest Oyun",
            data: [95, 30, 5, 0],
            backgroundColor: "#48bb78"
          },
          {
            label: "Sohbet",
            data: [25, 85, 45, 35],
            backgroundColor: "#319795"
          },
          {
            label: "Hikâye Anlatımı (Anlatı)",
            data: [10, 60, 90, 50],
            backgroundColor: "#4299e1"
          },
          {
            label: "Açıklayıcı Söylem (Expository)",
            data: [0, 10, 75, 95],
            backgroundColor: "#805ad5"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: %${ctx.raw} Klinik Tercih Edilebilirlik / Uygunluk`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { callback: v => `%${v}` }
          }
        }
      }
    });
  }
}
