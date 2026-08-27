// Curated mechanism data for the depth layer.
//
// The ICTV VMR gives taxonomy, genome composition and host source for all 427
// families, machine-readable and complete. It does not carry the fields that
// make a comparative reference useful — capsid symmetry, envelope, entry
// receptor, replication site, tropism. Those live in ViralZone factsheets and
// the primary literature, and are hand-assembled here.
//
// Rules for this file:
//
//   * Every value carries a `confidence`. Nothing is asserted flatly that the
//     field does not actually agree on.
//       established — well characterised and not seriously disputed *within
//                     the scope shown*; with no `scope`, that is the family
//       varies      — genuinely differs across genera/species in the family
//       contested   — reported, but the literature disagrees
//       unknown     — not characterised; rendered as absent, not guessed
//     `established` used to read "for the family as a whole", which stopped
//     being true the moment `scope` existed — a value can now be settled for
//     Orthocoronavirinae and silent about the rest of Coronaviridae.
//   * `varies` and `scope` answer different questions, and picking the wrong
//     one misstates what is known. `varies` means the other members are known
//     to differ: Caliciviridae's tropism, where the vesiviruses are
//     respiratory and the lagoviruses systemic. `scope` means the other
//     members have not been characterised at all: Coronaviridae's capsid,
//     settled for the orthocoronaviruses and unstudied in the two subfamilies
//     known only from sequence. Reaching for `varies` where the truth is
//     absence of study invents a diversity nobody has demonstrated.
//   * `note` carries the caveat when a single value would mislead.
//   * `citation` is required when a value departs from the family factsheet,
//     and only then. The factsheet is the default source; a row that does not
//     rest on it has to say what it does rest on. Shape:
//       citation: [{ title, journal, year, doi, pmid }]
//     The case that forced it: ViralZone gives Astroviridae's tropism as
//     enterocytes alone, but neurotropic astroviruses are documented in humans
//     and pigs. Marking that row `varies` while still pointing at a factsheet
//     that says otherwise would have been a false attribution.
//     This is the failure mode no check here can catch. A source can be the
//     current release, correctly transcribed, and still behind the literature.
//     Only reading finds those.
//   * `scope` names the taxon a value actually covers when that is narrower
//     than the family, and the UI prints it beside the value. A confidence tag
//     says how settled a claim is; it does not say what the claim is settled
//     *about*. Coronaviridae's capsid was "helical — established", which is
//     true of Orthocoronavirinae and simply unstudied for the Letovirinae and
//     Pitovirinae in the same family. Neither `established` nor `varies` was
//     the right answer there; the missing information was the scope.
//     Reach for it whenever a value is really about the well-studied part of a
//     family rather than the family.
//   * Watch the currency of the citation, not just its existence. ViralZone
//     factsheets can describe a circumscription ICTV has since changed — the
//     Coronaviridae page still discusses torovirus nucleocapsids, though ICTV
//     moved Torovirus to Tobaniviridae. A value transcribed faithfully from a
//     factsheet can still be wrong for the family as MSL41 now defines it.
//   * `diameter` is `[min, max]` in nanometres, and it is what the compare
//     view scales the virion schematics by. For particles that are not
//     spherical — poxviruses, rhabdoviruses, filoviruses — the pair is the
//     long axis and the `note` says so, because a "diameter" for a 1400 nm
//     filament would otherwise be read as a width.
//   * Omitting a key and writing `{ value: null, confidence: 'unknown' }` are
//     different claims, and the UI prints them differently:
//       omitted        -> "not curated"      — we have not established it
//       null + unknown -> "not characterised" — the field has not established it
//     Use null only with positive evidence of non-characterisation, the way
//     Poxviridae's receptor does. A factsheet that is merely silent on a field
//     is not that evidence: omit the key instead. Getting this backwards
//     attributes our own gaps to virology, which is the worse error.
//   * Nothing here is a number the VMR could have given us. Baltimore class,
//     host range and genome composition are derived in build-catalog.mjs from
//     the VMR itself rather than typed out again. Host range in particular is
//     why most entries carry no `tropism`: the family factsheets often give
//     only the host, which the skeleton layer already has.
//
// Source for mechanism fields unless otherwise noted: ViralZone (SIB Swiss
// Institute of Bioinformatics), CC BY 4.0. Per-cell primary-literature
// citations are M4 work; until then the family factsheet is the citation, and
// its page id is resolved at build time rather than hand-entered.

/** @type {Record<string, object>} */
export const FAMILIES = {
  // ---- Class I: dsDNA -------------------------------------------------------
  Orthoherpesviridae: {
    capsid: { value: 'icosahedral, T=16', confidence: 'established' },
    envelope: { value: true, confidence: 'established', note: 'enveloped, with a proteinaceous tegument layer between capsid and membrane' },
    receptor: {
      value: ['nectin-1', 'HVEM', 'CD21/CR2', 'HLA class II', 'PDGFRα', 'integrins'],
      confidence: 'varies',
      note: 'differs sharply by subfamily: HSV uses nectin-1 and HVEM, EBV uses CD21/CR2 with HLA class II, HCMV uses PDGFRα and integrins',
    },
    replicationSite: { value: 'nucleus', confidence: 'established' },
    tropism: { value: 'varies', confidence: 'varies', note: 'neurotropic (alpha), lymphotropic (gamma), broad epithelial and myeloid (beta)' },
    diameter: { value: [150, 200], confidence: 'established' },
    genomeSize: { value: '125–241 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Establishes lifelong latency, with a genuinely different transcriptional programme from lytic replication.',
    notable: ['Herpes simplex virus 1', 'Varicella-zoster virus', 'Epstein-Barr virus', 'Human cytomegalovirus'],
  },

  Poxviridae: {
    capsid: { value: 'complex, brick-shaped', confidence: 'established', note: 'no icosahedral or helical symmetry — one of the few families with neither' },
    envelope: { value: true, confidence: 'established', note: 'several distinct infectious forms differing in membrane count' },
    receptor: { value: null, confidence: 'unknown', note: 'no single proteinaceous receptor identified; entry via macropinocytosis with glycosaminoglycan and laminin attachment' },
    replicationSite: { value: 'cytoplasm', confidence: 'established', note: 'exceptional for a DNA virus — encodes its own transcription and replication machinery rather than using host nuclear polymerase' },
    tropism: {
      value: 'broad; epithelial and myeloid',
      confidence: 'established',
      scope: 'Chordopoxvirinae',
      note: 'the entomopoxviruses are the other subfamily and infect insects; this describes the vertebrate-infecting members only',
    },
    diameter: { value: [220, 450], confidence: 'established', note: 'brick-shaped rather than spherical: 220–450 nm long and 140–260 nm wide, so this range is length' },
    genomeSize: { value: '128–375 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Replicates entirely in the cytoplasm, carrying the enzymes to do so inside the particle.',
    notable: ['Variola virus', 'Monkeypox virus', 'Vaccinia virus'],
  },

  Adenoviridae: {
    capsid: { value: 'icosahedral, T=25', confidence: 'established', note: 'penton fibres project from the vertices' },
    envelope: { value: false, confidence: 'established' },
    receptor: {
      value: ['CAR', 'CD46', 'desmoglein-2'],
      confidence: 'varies',
      note: 'most species use CAR; species B largely uses CD46 or desmoglein-2. αv integrins act as internalisation co-receptors',
    },
    replicationSite: { value: 'nucleus', confidence: 'established' },
    tropism: {
      value: 'respiratory, ocular and gastrointestinal epithelium',
      confidence: 'established',
      scope: 'Mastadenovirus',
      note: 'the family factsheet gives no cell tropism at all; this is the human adenovirus case. The family also holds bird, reptile, amphibian and fish genera',
    },
    diameter: { value: [90, 90], confidence: 'established', note: 'the capsid measures about 90 nm' },
    genomeSize: { value: '26–48 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Widely re-engineered as a gene-delivery and vaccine vector.',
    notable: ['Human adenovirus B', 'Human adenovirus C'],
  },

  Papillomaviridae: {
    capsid: { value: 'icosahedral, T=7', confidence: 'established' },
    envelope: { value: false, confidence: 'established' },
    receptor: { value: ['heparan sulfate proteoglycans'], confidence: 'contested', note: 'HSPG is the established primary attachment factor; the secondary entry receptor remains disputed' },
    replicationSite: { value: 'nucleus', confidence: 'established' },
    tropism: { value: 'squamous epithelium (cutaneous and mucosal)', confidence: 'established' },
    diameter: { value: [60, 60], confidence: 'established' },
    genomeSize: { value: '~8 kb', confidence: 'established', note: 'circular dsDNA' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'The replication cycle is tied to keratinocyte differentiation — the virus cannot complete it in an undifferentiated cell.',
    notable: ['Human papillomavirus 16', 'Human papillomavirus 18'],
  },

  Polyomaviridae: {
    capsid: { value: 'icosahedral, T=7', confidence: 'established' },
    envelope: { value: false, confidence: 'established' },
    receptor: {
      value: ['sialylated glycans / gangliosides', 'serotonin 5-HT2A receptor (JCPyV)'],
      confidence: 'varies',
      note: 'gangliosides such as GD1a and GT1b for most; JC polyomavirus additionally uses LSTc and the 5-HT2A receptor',
    },
    replicationSite: { value: 'nucleus', confidence: 'established' },
    tropism: { value: 'varies; renal, neural and lymphoid', confidence: 'varies' },
    diameter: { value: [50, 50], confidence: 'established' },
    genomeSize: { value: '~5 kb', confidence: 'established', note: 'circular dsDNA' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Persists asymptomatically in most adults; disease is largely a consequence of immunosuppression.',
    notable: ['JC polyomavirus', 'BK polyomavirus', 'Simian virus 40'],
  },

  Alloherpesviridae: {
    capsid: { value: 'icosahedral, T=16', confidence: 'established', note: '162 capsomers' },
    envelope: { value: true, confidence: 'established', note: 'spherical to pleomorphic, 150–200 nm' },
    replicationSite: { value: 'nucleus', confidence: 'established', note: 'the capsid is transported to the nuclear pore and the genome released into the nucleus' },
    diameter: { value: [150, 200], confidence: 'established' },
    genomeSize: { value: '134–248 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'The herpesviruses of fish and amphibians, placed in their own family rather than with the mammalian and avian herpesviruses.',
    notable: ['Cyprinid herpesvirus 3', 'Ictalurid herpesvirus 1', 'Ranid herpesvirus 1'],
  },

  Iridoviridae: {
    capsid: { value: 'icosahedral, T=189–217', confidence: 'established' },
    envelope: {
      value: 'varies',
      confidence: 'varies',
      note: 'externally enveloped when budded from the cell membrane; released non-enveloped by lysis, so both forms are infectious',
    },
    replicationSite: {
      value: 'nucleus and cytoplasm',
      confidence: 'established',
      note: 'initial transcription in the nucleus; progeny DNA concatemers form in cytoplasmic viral factories',
    },
    tropism: { value: 'hemocytes and adipose tissue cells', confidence: 'varies', note: 'given for the insect-infecting members; the factsheet does not give a tissue tropism for the fish and amphibian members' },
    diameter: { value: [120, 350], confidence: 'established' },
    genomeSize: { value: '140–303 kb', confidence: 'established' },
    distinctive: 'Splits replication across both compartments — transcription starts in the nucleus, then moves to cytoplasmic factories.',
    notable: ['Frog virus 3', 'Lymphocystis disease virus 1', 'Invertebrate iridescent virus 6'],
  },

  // ---- Class II: ssDNA ------------------------------------------------------
  Parvoviridae: {
    capsid: { value: 'icosahedral, T=1', confidence: 'established', note: '18–26 nm — among the smallest virions known' },
    envelope: { value: false, confidence: 'established' },
    receptor: {
      value: ['globoside (P antigen)', 'AAVR (KIAA0319L)', 'heparan sulfate proteoglycans'],
      confidence: 'varies',
      note: 'B19 uses globoside with α5β1 integrin and KU80 as co-receptors; adeno-associated viruses use AAVR with serotype-specific glycan attachment',
    },
    replicationSite: { value: 'nucleus', confidence: 'established' },
    tropism: { value: 'varies; erythroid progenitors (B19)', confidence: 'varies' },
    diameter: { value: [18, 26], confidence: 'established' },
    genomeSize: { value: '4–6 kb', confidence: 'established', note: 'linear ssDNA' },
    segments: { value: 1, confidence: 'varies', note: 'monopartite throughout the vertebrate-infecting members; Acheta domesticus segmented densovirus is the exception, deposited as two segments' },
    distinctive: 'Carries no polymerase and cannot make one — replication depends on a host cell already in S phase.',
    notable: ['Human parvovirus B19', 'Adeno-associated virus 2'],
  },

  Anelloviridae: {
    capsid: { value: 'icosahedral, T=1', confidence: 'established' },
    envelope: { value: false, confidence: 'established' },
    replicationSite: { value: 'nucleus', confidence: 'established' },
    diameter: { value: [30, 32], confidence: 'established' },
    genomeSize: { value: '~3.8 kb', confidence: 'established', note: 'circular ssDNA' },
    distinctive: 'Small circular ssDNA viruses carried across a very wide host range — humans, chimpanzees, African monkeys, tupaia, pigs, cattle, sheep and chickens.',
    notable: ['Torque teno virus 1', 'Torque teno mini virus 1', 'Torque teno midi virus 1'],
  },

  Circoviridae: {
    capsid: { value: 'icosahedral, T=1', confidence: 'established', note: '12 pentagonal trumpet-shaped pentamers' },
    envelope: { value: false, confidence: 'established' },
    replicationSite: { value: 'nucleus', confidence: 'established', note: 'rolling-circle replication' },
    diameter: { value: [20, 20], confidence: 'established' },
    genomeSize: { value: '1.8–3.8 kb', confidence: 'established', note: 'circular ssDNA' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Copies its circular genome by rolling-circle replication in the nucleus, inside a T=1 capsid built from twelve trumpet-shaped pentamers.',
    notable: ['Porcine circovirus 2', 'Beak and feather disease virus'],
  },

  Genomoviridae: {
    capsid: { value: 'icosahedral, T=1', confidence: 'established' },
    envelope: { value: false, confidence: 'established' },
    diameter: { value: [20, 20], confidence: 'established' },
    genomeSize: { value: '~2.17 kb', confidence: 'established', note: 'circular ssDNA' },
    segments: { value: 1, confidence: 'varies', note: 'monopartite across almost the whole family; Fusarium graminearum gemytripvirus 1 is deposited as three components' },
    distinctive: 'Spans hosts from humans, other mammals and birds all the way to fungi — a host range that crosses kingdoms within one family.',
    notable: ['Sclerotinia sclerotiorum hypovirulence associated DNA virus 1', 'Human associated gemyvongvirus 1'],
  },

  // ---- Class III: dsRNA -----------------------------------------------------
  Sedoreoviridae: {
    capsid: { value: 'icosahedral, multilayered', confidence: 'established', note: 'rotavirus particles are triple-layered' },
    envelope: { value: false, confidence: 'established' },
    receptor: {
      value: ['histo-blood group antigens', 'integrins', 'Hsc70'],
      confidence: 'varies',
      note: 'rotavirus attachment is genotype-dependent; sialic acid use differs between animal and human strains',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established', note: 'in viroplasms; the genome is never fully uncoated, transcription occurring inside the core particle' },
    tropism: {
      value: 'varies',
      confidence: 'varies',
      note: 'the factsheet gives three: mucosal gut cells in vertebrates, mid-gut cells in insects, and phloem neoplastic tissue in plants. The enterocyte tropism is the rotavirus case, not the family',
    },
    genomeSize: { value: '18–21 kb total', confidence: 'established' },
    segments: { value: 11, confidence: 'varies', note: 'varies by genus: 11 for rotavirus, and up to 12 in the phytoreoviruses — rice dwarf virus is deposited with 12' },
    distinctive: 'Keeps its dsRNA genome inside the capsid throughout replication, which avoids exposing it to cytoplasmic dsRNA sensors.',
    notable: ['Rotavirus A'],
  },

  Birnaviridae: {
    capsid: { value: 'icosahedral, T=13', confidence: 'established' },
    envelope: { value: false, confidence: 'established' },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: {
      value: 'varies',
      confidence: 'varies',
      note: 'IBDV infects the precursors of antibody-producing B cells in the bursa of Fabricius; IPNV infects salmonid fish',
    },
    diameter: { value: [70, 70], confidence: 'established' },
    genomeSize: { value: '~6 kb', confidence: 'established', note: 'two segments of about 2.3–3 kb each' },
    segments: { value: 2, confidence: 'established', note: 'segments A and B' },
    distinctive: 'Infectious bursal disease virus targets the precursors of antibody-producing B cells in the bursa of Fabricius, so the damage falls on the host immune system itself.',
    notable: ['Infectious pancreatic necrosis virus', 'Infectious bursal disease virus', 'Drosophila X virus'],
  },

  // ---- Class IV: +ssRNA -----------------------------------------------------
  Coronaviridae: {
    capsid: {
      value: 'helical nucleocapsid',
      confidence: 'established',
      scope: 'Orthocoronavirinae',
      note: 'the other two subfamilies in this release, Letovirinae and Pitovirinae, are one species each and known from sequence rather than from a characterised particle',
    },
    envelope: { value: true, confidence: 'established', note: 'club-shaped spike projections give the family its name' },
    receptor: {
      value: ['ACE2', 'DPP4', 'aminopeptidase N', '9-O-acetylated sialic acid', 'CEACAM1'],
      confidence: 'varies',
      scope: 'Orthocoronavirinae',
      note: 'ACE2 for SARS-CoV, SARS-CoV-2 and HCoV-NL63; DPP4 for MERS-CoV; APN for HCoV-229E, TGEV and PEDV; sialic acid for HCoV-OC43, HKU1 and BCoV; CEACAM1 for murine coronavirus',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established', note: 'within virus-induced double-membrane vesicles' },
    tropism: { value: 'respiratory and enteric epithelium', confidence: 'varies' },
    diameter: { value: [120, 120], confidence: 'established' },
    genomeSize: { value: '26–32 kb', confidence: 'established', note: 'the largest known RNA virus genomes' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Encodes a proofreading exonuclease (nsp14-ExoN) — the reason a genome this large is viable as RNA, and the reason mutation rates sit below other RNA families.',
    notable: ['Severe acute respiratory syndrome coronavirus 2', 'Middle East respiratory syndrome-related coronavirus'],
  },

  Picornaviridae: {
    capsid: { value: 'icosahedral, pseudo-T=3', confidence: 'established' },
    envelope: { value: false, confidence: 'established' },
    receptor: {
      value: ['CD155 (PVR)', 'ICAM-1', 'LDLR', 'TIM-1'],
      confidence: 'varies',
      note: 'poliovirus uses CD155; major-group rhinoviruses ICAM-1 and minor-group LDLR; hepatitis A virus TIM-1',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: { value: 'varies; enteric, respiratory, neural and hepatic', confidence: 'varies' },
    diameter: { value: [30, 30], confidence: 'established' },
    genomeSize: { value: '7–9 kb', confidence: 'established', note: 'VPg protein covalently linked to the 5′ end in place of a cap' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Translated from an IRES as a single polyprotein, then cut up by virally encoded proteases.',
    notable: ['Poliovirus', 'Rhinovirus A', 'Enterovirus A71', 'Hepatitis A virus'],
  },

  Flaviviridae: {
    capsid: { value: 'icosahedral', confidence: 'established', note: 'mature flavivirus particles carry a smooth herringbone arrangement of E protein rather than a conventional exposed capsid' },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['CD81 + SR-B1 + claudin-1 + occludin (HCV)', 'AXL', 'DC-SIGN', 'TIM/TAM family'],
      confidence: 'contested',
      note: 'the HCV entry complex is well established; for the mosquito-borne flaviviruses no single receptor is settled, and most candidates are attachment factors rather than obligate receptors',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established', note: 'on ER-derived invaginated membranes' },
    tropism: { value: 'varies; hepatic (HCV), neural and dermal (arboviruses)', confidence: 'varies' },
    diameter: { value: [50, 50], confidence: 'established' },
    genomeSize: { value: '9.6–12.3 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'varies', note: 'monopartite in the orthoflaviviruses, hepaciviruses and pestiviruses; the jingmenviruses and Guaicovirus are segmented, deposited with 4–5 segments in this release' },
    distinctive: 'Antibody-dependent enhancement between dengue serotypes is the clearest case where prior immunity worsens rather than protects.',
    notable: ['Dengue virus', 'Zika virus', 'Yellow fever virus', 'West Nile virus', 'Hepatitis C virus'],
  },

  Caliciviridae: {
    capsid: { value: 'icosahedral, T=3', confidence: 'established' },
    envelope: { value: false, confidence: 'established' },
    receptor: {
      value: ['histo-blood group antigens (attachment)', 'CD300lf (murine norovirus)'],
      confidence: 'contested',
      scope: 'Norovirus',
      note: 'HBGAs are established attachment factors and explain genetic resistance in FUT2 non-secretors; the human norovirus proteinaceous receptor is not settled. CD300lf is established for murine norovirus. The other genera in the family have no characterised receptor',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: {
      value: 'varies',
      confidence: 'varies',
      note: 'intestinal epithelium in the enteric genera (Norovirus, Sapovirus, Nebovirus); upper respiratory tract and conjunctiva in Vesivirus, which includes feline calicivirus; systemic and often fatally haemorrhagic in Lagovirus',
    },
    diameter: { value: [27, 40], confidence: 'established' },
    genomeSize: { value: '7.4–8.3 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Human norovirus resisted routine cell culture for decades, which is why so much of its biology was worked out in surrogates.',
    notable: ['Norwalk virus'],
  },

  Togaviridae: {
    capsid: { value: 'icosahedral, T=4', confidence: 'established' },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['MXRA8', 'LDLRAD3'],
      confidence: 'varies',
      note: 'MXRA8 for arthritogenic alphaviruses including chikungunya and Ross River; LDLRAD3 for Venezuelan equine encephalitis virus',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established', note: 'in plasma-membrane-derived spherules' },
    tropism: { value: 'varies; joint and muscle (arthritogenic), neural (encephalitic)', confidence: 'varies' },
    diameter: { value: [65, 70], confidence: 'established' },
    genomeSize: { value: '11–12 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Structural proteins come from a separate subgenomic RNA, so they can be made in vast excess over the replicase.',
    notable: ['Chikungunya virus', 'Venezuelan equine encephalitis virus', 'Sindbis virus'],
  },

  // Every field here described rubella virus alone until the family stopped
  // being monotypic. Ruhugu and rustrela viruses were described in 2020 and
  // ViralZone's factsheet predates them, so the corrections below rest on the
  // primary literature rather than on the factsheet.
  Matonaviridae: {
    capsid: {
      value: 'icosahedral',
      confidence: 'established',
      scope: 'Rubivirus rubellae',
      note: 'pleomorphic particles; the two species described in 2020 are known largely from sequence and their particles are not comparably characterised',
    },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['MOG (myelin oligodendrocyte glycoprotein)'],
      confidence: 'established',
      scope: 'Rubivirus rubellae',
      note: 'demonstrated for rubella virus; there is no experimental evidence that ruhugu or rustrela virus uses MOG',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: {
      value: 'varies',
      confidence: 'varies',
      note: 'respiratory entry then systemic, placental and fetal infection for rubella virus; predominantly neural in rustrela virus, which causes fatal encephalitis in spillover hosts; ruhugu virus was found in apparently healthy bats and is not characterised',
      citation: [
        {
          title: 'Relatives of rubella virus in diverse mammals',
          journal: 'Nature',
          year: 2020,
          doi: '10.1038/s41586-020-2812-9',
          pmid: '33029010',
        },
        {
          title: 'Revisiting Rustrela Virus: New Cases of Encephalitis and a Solution to the Capsid Enigma',
          journal: 'Microbiol Spectr',
          year: 2022,
          doi: '10.1128/spectrum.00103-22',
          pmid: '35384712',
        },
      ],
    },
    diameter: {
      value: [70, 80],
      confidence: 'established',
      scope: 'Rubivirus rubellae',
    },
    genomeSize: { value: '~9.8 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Contains rubella virus, whose clinical weight is almost entirely congenital, alongside the animal viruses described in 2020 — including the neurotropic rustrela virus. Split out of Togaviridae in 2018.',
    notable: ['Rubella virus', 'Rustrela virus', 'Ruhugu virus'],
  },

  Hepeviridae: {
    capsid: { value: 'icosahedral, T=3', confidence: 'established' },
    envelope: { value: false, confidence: 'varies', note: 'non-enveloped when shed in bile and faeces, but quasi-enveloped in a host-derived membrane while circulating in blood' },
    receptor: { value: null, confidence: 'unknown', note: 'heparan sulfate proteoglycans act as attachment factors; no receptor established' },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: {
      value: 'hepatocytes',
      confidence: 'established',
      scope: 'Orthohepevirinae',
      note: 'Parahepevirinae holds a single fish virus, cutthroat trout virus, whose tropism is not described here',
    },
    diameter: { value: [32, 32], confidence: 'established' },
    genomeSize: { value: '~7.2 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Exists in two physical forms depending on which compartment it is in — a rare case where "enveloped" is not a fixed property of the family.',
    notable: ['Hepatitis E virus'],
  },

  Arteriviridae: {
    envelope: { value: true, confidence: 'established', note: 'spherical, 45–60 nm' },
    receptor: {
      value: ['sialoadhesin'],
      confidence: 'varies',
      note: 'reported for PRRSV; the family factsheet names no receptor for the other genera',
    },
    replicationSite: {
      value: 'cytoplasm',
      confidence: 'established',
      note: 'in viral factories, with budding at membranes of the ER, intermediate compartments and/or Golgi',
    },
    tropism: {
      value: 'macrophages',
      confidence: 'established',
      scope: 'Equarterivirinae and Variarterivirinae',
      note: 'EAV in lung macrophages then lymph nodes; PRRSV in alveolar and other tissue macrophages, later in testicular germ cells. The family has six subfamilies and these are the two with a characterised member',
    },
    diameter: { value: [45, 60], confidence: 'established' },
    genomeSize: { value: '12–16 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Nidovirales with a macrophage tropism rather than the epithelial one the order is better known for.',
    notable: ['Equine arteritis virus', 'Porcine reproductive and respiratory syndrome virus', 'Simian hemorrhagic fever virus'],
  },

  Astroviridae: {
    capsid: { value: 'icosahedral, T=3', confidence: 'established' },
    envelope: { value: false, confidence: 'established' },
    replicationSite: {
      value: 'cytoplasm',
      confidence: 'established',
      note: 'in viral factories made of ER-derived membrane vesicles',
    },
    tropism: {
      value: 'varies',
      confidence: 'varies',
      note: 'enterocytes in the classical enteric astroviruses; neurons and other neural tissue in several neurotropic mammalian lineages. The ViralZone factsheet still gives enterocytes alone, so this value comes from the primary literature instead',
      citation: [
        {
          title: 'Propagation of Astrovirus VA1, a Neurotropic Human Astrovirus, in Cell Culture',
          journal: 'J Virol',
          year: 2017,
          doi: '10.1128/JVI.00740-17',
          pmid: '28701405',
        },
        {
          title: 'Experimental porcine astrovirus type 3-associated polioencephalomyelitis in swine',
          journal: 'Vet Pathol',
          year: 2021,
          doi: '10.1177/03009858211025794',
          pmid: '34657543',
        },
      ],
    },
    diameter: { value: [35, 35], confidence: 'established', note: 'the capsid measures about 35 nm' },
    genomeSize: { value: '6.8–7 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Builds its replication factories out of membrane vesicles derived from the ER. Long read as a purely enteric family, it turns out to include neurotropic lineages that cause encephalitis in humans and pigs.',
    notable: ['Human astrovirus 1', 'Turkey astrovirus 1'],
  },

  Nodaviridae: {
    capsid: { value: 'icosahedral, T=3', confidence: 'established', note: '180 protein subunits, about 30 nm' },
    envelope: { value: false, confidence: 'established' },
    replicationSite: { value: 'cytoplasm', confidence: 'established', note: 'in cytoplasmic viral factories' },
    tropism: {
      value: 'nervous tissue and retina',
      confidence: 'varies',
      note: 'betanodaviruses cause viral encephalopathy and retinopathy in fish; the alphanodaviruses infect insects',
    },
    diameter: { value: [30, 30], confidence: 'established' },
    genomeSize: { value: '~4.5 kb', confidence: 'established', note: 'RNA1 3.1 kb and RNA2 1.4 kb' },
    segments: { value: 2, confidence: 'established', note: 'a subgenomic RNA3 is produced during replication' },
    distinctive: 'Splits a small genome across two segments, RNA1 and RNA2, and the fish-infecting betanodaviruses turn that into encephalopathy and retinopathy.',
    notable: ['Nodamura virus', 'Flock House virus', 'Striped jack nervous necrosis virus'],
  },

  Tombusviridae: {
    capsid: { value: 'icosahedral, T=3', confidence: 'established', note: '180 protein subunits, 28–34 nm' },
    envelope: { value: false, confidence: 'established' },
    replicationSite: { value: 'cytoplasm', confidence: 'established', note: 'in cytoplasmic viral factories' },
    diameter: { value: [28, 34], confidence: 'established' },
    genomeSize: { value: '4–5.4 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'varies', note: 'monopartite except Dianthovirus, which is bipartite' },
    distinctive: 'Monopartite throughout except Dianthovirus, whose genome is split in two — a single-genus exception inside an otherwise uniform family.',
    notable: ['Tomato bushy stunt virus', 'Turnip crinkle virus', 'Maize chlorotic mottle virus'],
  },

  // ---- Class V: −ssRNA ------------------------------------------------------
  Orthomyxoviridae: {
    capsid: { value: 'helical ribonucleoproteins', confidence: 'established' },
    envelope: { value: true, confidence: 'established', note: 'pleomorphic, spherical to filamentous' },
    receptor: {
      value: ['sialic acid (α2,6-linked)', 'sialic acid (α2,3-linked)'],
      confidence: 'established',
      scope: 'the influenza genera',
      note: 'α2,6 in the human upper airway and α2,3 in avian gut and the human lower airway — the shift in binding preference is what receptor-switching in a pandemic strain refers to. The tick-borne and fish-infecting genera are not covered',
    },
    replicationSite: { value: 'nucleus', confidence: 'established', note: 'unusual for an RNA virus; enables cap-snatching from host transcripts and splicing of viral mRNAs' },
    tropism: {
      value: 'varies',
      confidence: 'varies',
      note: 'respiratory epithelium for the four influenza genera; Isavirus causes a systemic anaemia in salmon, and the tick-borne genera are not characterised',
    },
    diameter: { value: [80, 120], confidence: 'established' },
    genomeSize: { value: '12–15 kb total', confidence: 'established' },
    segments: { value: 8, confidence: 'varies', note: '8 for influenza A and B, 7 for C and D' },
    distinctive: 'A segmented genome allows reassortment between co-infecting strains — antigenic shift, and the mechanism behind pandemic emergence as distinct from seasonal drift.',
    notable: ['Influenza A virus', 'Influenza B virus'],
  },

  Paramyxoviridae: {
    capsid: { value: 'helical nucleocapsid', confidence: 'established' },
    envelope: { value: true, confidence: 'established', note: 'pleomorphic' },
    receptor: {
      value: ['CD150 (SLAM)', 'nectin-4', 'ephrin-B2 / ephrin-B3', 'sialic acid'],
      confidence: 'varies',
      note: 'measles uses CD150 then nectin-4; Nipah and Hendra use ephrin-B2 and B3, which are highly conserved and explain their broad mammalian host range; mumps and parainfluenza use sialic acid',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: { value: 'varies; lymphoid then respiratory epithelium (measles), neural and endothelial (henipaviruses)', confidence: 'varies' },
    diameter: { value: [150, 150], confidence: 'established' },
    genomeSize: { value: '15–19 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Measles infection depletes pre-existing immune memory — "immune amnesia" — so its harm outlasts the acute illness.',
    notable: ['Measles morbillivirus', 'Mumps orthorubulavirus', 'Nipah henipavirus', 'Hendra henipavirus'],
  },

  Pneumoviridae: {
    capsid: { value: 'helical nucleocapsid', confidence: 'established' },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['CX3CR1', 'heparan sulfate proteoglycans'],
      confidence: 'contested',
      note: 'CX3CR1 is the best-supported receptor on ciliated airway cells; HSPG binding is prominent in cultured cells but of doubtful relevance in airway tissue, and nucleolin remains proposed rather than settled',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established', note: 'in inclusion bodies that function as biomolecular condensates' },
    tropism: { value: 'ciliated respiratory epithelium', confidence: 'established' },
    diameter: { value: [150, 150], confidence: 'established' },
    genomeSize: { value: '13–15 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Split from Paramyxoviridae in 2016. Stabilising the fusion protein in its prefusion conformation is what finally made an RSV vaccine work, after a formalin-inactivated candidate worsened disease in the 1960s.',
    notable: ['Human respiratory syncytial virus', 'Human metapneumovirus'],
  },

  Rhabdoviridae: {
    capsid: {
      value: 'helical nucleocapsid',
      confidence: 'established',
      note: 'bullet-shaped in the animal-infecting subfamilies; the plant-infecting Betarhabdovirinae, which are more than a third of the family, are bacilliform',
    },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['nAChR', 'NCAM', 'p75NTR', 'LDL receptor (VSV)'],
      confidence: 'varies',
      note: 'several candidates reported for rabies virus and none is exclusive; the LDL receptor is established for vesicular stomatitis virus',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: { value: 'neurons (rabies); broad in vitro', confidence: 'varies' },
    diameter: { value: [75, 180], confidence: 'established', note: 'bullet-shaped: 180 nm long and 75 nm wide; some plant rhabdoviruses are almost twice that length' },
    genomeSize: { value: '11–15 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'varies', note: 'monopartite for the great majority; a few plant-infecting genera are bi- or tripartite, such as Alnus trirhavirus 1 with three' },
    distinctive: 'Rabies travels to the CNS by retrograde axonal transport, which is why the incubation period depends on where the bite was.',
    notable: ['Rabies lyssavirus', 'Vesicular stomatitis Indiana virus'],
  },

  Filoviridae: {
    capsid: { value: 'helical nucleocapsid', confidence: 'established', note: 'filamentous virion, often looped or branched, up to ~1400 nm long' },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['NPC1'],
      confidence: 'established',
      scope: 'Orthoebolavirus and Orthomarburgvirus',
      note: 'NPC1 is engaged inside the endosome after cathepsin cleavage of GP, rather than at the cell surface. Established for the studied filoviruses only',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: {
      value: 'monocytes, macrophages, dendritic cells, then hepatocytes and endothelium',
      confidence: 'established',
      scope: 'Orthoebolavirus and Orthomarburgvirus',
      note: 'the pathogenesis of the studied filoviruses; the fish-associated genera in this family have no characterised tropism',
    },
    diameter: { value: [80, 1400], confidence: 'established', note: 'filamentous rather than spherical: about 80 nm across but up to ~1400 nm long, so this range is length' },
    genomeSize: { value: '~19 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'The receptor sits inside the cell rather than on it, so entry cannot be blocked at the surface alone.',
    notable: ['Zaire ebolavirus', 'Marburg marburgvirus'],
  },

  Arenaviridae: {
    capsid: { value: 'helical nucleocapsid', confidence: 'established', note: 'pleomorphic; particles contain host ribosomes, giving the grainy appearance the family is named for' },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['α-dystroglycan', 'LAMP1', 'transferrin receptor 1'],
      confidence: 'varies',
      note: 'Old World arenaviruses including Lassa and LCMV use α-dystroglycan, with Lassa switching to LAMP1 at endosomal pH; New World arenaviruses such as Junín and Machupo use TfR1',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: { value: 'broad; macrophages and endothelium', confidence: 'varies' },
    diameter: { value: [60, 300], confidence: 'established' },
    genomeSize: { value: '~10.5 kb total', confidence: 'established' },
    segments: { value: 2, confidence: 'established', note: 'L and S, both ambisense' },
    distinctive: 'Ambisense coding — each segment carries genes in both orientations, so some proteins can only be made after the genome has been copied.',
    notable: ['Lassa mammarenavirus', 'Lymphocytic choriomeningitis mammarenavirus', 'Junín mammarenavirus'],
  },

  Hantaviridae: {
    capsid: { value: 'helical nucleocapsid', confidence: 'established', note: 'roughly spherical, with a gridded surface lattice' },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['β3 integrins', 'β1 integrins', 'protocadherin-1'],
      confidence: 'varies',
      note: 'β3 integrin use tracks with pathogenicity; PCDH1 is established for Andes and Sin Nombre viruses in pulmonary endothelium',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: {
      value: 'vascular endothelium',
      confidence: 'established',
      scope: 'Mammantavirinae',
      note: 'the fish- and reptile-infecting subfamilies are a handful of species each and are not characterised',
    },
    diameter: { value: [80, 120], confidence: 'established' },
    genomeSize: { value: '11–12 kb total', confidence: 'established' },
    segments: { value: 3, confidence: 'established', note: 'L, M and S' },
    distinctive: 'Rodent-borne rather than arthropod-borne, unlike the rest of the order — transmission is by aerosolised excreta, so the ecology is one of buildings and rodent population cycles.',
    notable: ['Hantaan orthohantavirus', 'Sin Nombre orthohantavirus', 'Andes orthohantavirus'],
  },

  Nairoviridae: {
    capsid: { value: 'helical nucleocapsid', confidence: 'established' },
    envelope: { value: true, confidence: 'established' },
    receptor: { value: null, confidence: 'unknown', note: 'no receptor established for Crimean-Congo haemorrhagic fever virus; the LDL receptor has been proposed' },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: {
      value: 'endothelium, hepatocytes and mononuclear phagocytes',
      confidence: 'established',
      scope: 'Orthonairovirus',
      note: 'drawn from CCHFV; Orthonairovirus is 64 of the 71 isolates here and the factsheet describes no other genus',
    },
    diameter: { value: [80, 120], confidence: 'established' },
    genomeSize: { value: '~19 kb total', confidence: 'established', note: 'the largest genome in the order, driven by an unusually long L segment' },
    segments: { value: 3, confidence: 'established', note: 'L, M and S' },
    distinctive: 'Tick-borne, with the tick acting as both vector and long-term reservoir across moults and generations.',
    notable: ['Crimean-Congo hemorrhagic fever orthonairovirus'],
  },

  Phenuiviridae: {
    capsid: { value: 'helical nucleocapsid', confidence: 'established' },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['LRP1', 'DC-SIGN (attachment)'],
      confidence: 'contested',
      note: 'LRP1 is well supported for Rift Valley fever virus; receptors for the tick-borne phenuiviruses are not established',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: { value: 'varies; hepatic (RVFV), lymphoid (SFTSV)', confidence: 'varies' },
    diameter: { value: [80, 120], confidence: 'established' },
    genomeSize: { value: '11–12 kb total', confidence: 'established' },
    segments: { value: 3, confidence: 'varies', note: 'L, M and S for the animal-infecting genera, the S segment ambisense; several plant-infecting members carry more, up to eight in this release' },
    distinctive: 'Rift Valley fever outbreaks track heavy rainfall flooding mosquito breeding habitat, which makes them among the more genuinely forecastable arboviral events.',
    notable: ['Rift Valley fever phlebovirus', 'Dabie bandavirus (SFTSV)', 'Toscana phlebovirus'],
  },

  Bornaviridae: {
    envelope: { value: true, confidence: 'established', note: 'spherical, 70–130 nm' },
    replicationSite: {
      value: 'nucleus',
      confidence: 'established',
      note: 'ribonucleocapsids migrate to the nucleus after entry and progeny leave by nuclear pore export — unusual among the −ssRNA families, which otherwise replicate in the cytoplasm',
    },
    tropism: {
      value: 'neurons and astrocytes',
      confidence: 'established',
      note: 'oligodendrocytes and ependymal cells can also be infected',
    },
    diameter: { value: [70, 130], confidence: 'established' },
    genomeSize: { value: '~8.9 kb', confidence: 'established' },
    distinctive: 'Replicates in the nucleus, which almost no other negative-strand RNA family does.',
    notable: ['Borna disease virus 1', 'Mammalian 1 orthobornavirus'],
  },

  Nyamiviridae: {
    envelope: { value: true, confidence: 'established', note: 'spherical, 100–130 nm' },
    replicationSite: {
      value: 'nucleus',
      confidence: 'established',
      note: 'ribonucleocapsids migrate to the nucleus and exit by nuclear pore export',
    },
    diameter: { value: [100, 130], confidence: 'established' },
    genomeSize: { value: '~11.6 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'varies', note: 'monopartite for the nyaviruses; Wēnzhōu tapeworm virus 1 is deposited as two segments' },
    distinctive: 'Another negative-strand RNA family that replicates in the nucleus rather than the cytoplasm, carried between ticks and birds.',
    notable: ['Nyamanini nyavirus', 'Midway nyavirus'],
  },

  Peribunyaviridae: {
    envelope: { value: true, confidence: 'established', note: 'spherical, 80–120 nm' },
    replicationSite: { value: 'cytoplasm', confidence: 'established', note: 'budding at the Golgi apparatus' },
    tropism: {
      value: 'central nervous system, various organs and vascular endothelium',
      confidence: 'established',
      scope: 'human infection by Orthobunyavirus',
      note: 'the factsheet states this of human infection specifically; Orthobunyavirus is 215 of the 229 isolates here and the seven other genera are largely uncharacterised',
    },
    diameter: { value: [80, 120], confidence: 'established' },
    genomeSize: { value: 'L 6.8–12 kb, M 3.2–4.9 kb, S 1–3 kb', confidence: 'established' },
    segments: { value: 3, confidence: 'established', note: 'L, M and S' },
    distinctive: 'Arthropod-vectored with rodent and insect reservoirs; ticks and mosquitoes carry it to humans incidentally.',
    notable: ['Bunyamwera orthobunyavirus', 'La Crosse virus', 'Oropouche virus', 'Schmallenberg virus'],
  },

  Sunviridae: {
    envelope: { value: true, confidence: 'established', note: 'spherical' },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    genomeSize: { value: '~17 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'A negative-strand RNA family described from snakes, replicating in the cytoplasm with a genome of about 17 kb.',
    notable: ['Reptile sunshinevirus 1'],
  },

  // ---- Class VI: ssRNA-RT ---------------------------------------------------
  Retroviridae: {
    capsid: { value: 'varies', confidence: 'varies', note: 'lentiviral cores are conical; other genera form spherical or polyhedral cores' },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['CD4 + CCR5 / CXCR4', 'GLUT1 + NRP1'],
      confidence: 'varies',
      note: 'HIV requires CD4 with a chemokine co-receptor, and the CCR5-Δ32 genotype confers resistance; HTLV-1 uses GLUT1 with neuropilin-1 and HSPG',
    },
    replicationSite: { value: 'cytoplasm then nucleus', confidence: 'established', note: 'reverse transcription in the cytoplasm, then integration into host chromatin' },
    tropism: { value: 'CD4+ T cells and macrophages (HIV)', confidence: 'varies' },
    diameter: { value: [80, 100], confidence: 'established' },
    genomeSize: { value: '7–12 kb', confidence: 'established', note: 'two copies per particle — the genome is diploid' },
    segments: { value: 1, confidence: 'established', note: 'one genome, but packaged as two identical copies' },
    distinctive: 'Integrates into host DNA as a provirus. That is why infection is lifelong, and why cure requires clearing a latent reservoir rather than suppressing replication.',
    notable: ['Human immunodeficiency virus 1', 'Human T-cell leukemia virus 1'],
  },

  Metaviridae: {
    capsid: { value: 'icosahedral, T=9', confidence: 'established' },
    envelope: {
      value: 'uncertain',
      confidence: 'unknown',
      note: 'the family factsheet states only that virions "might be enveloped"',
    },
    replicationSite: {
      value: 'nucleus',
      confidence: 'established',
      note: 'the reverse-transcribed dsDNA is integrated into the host genome by a viral integrase',
    },
    genomeSize: { value: '~7–11 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'The Ty3/Gypsy retrotransposon lineage — mostly integrated elements rather than viruses that leave the cell.',
    notable: ['Saccharomyces cerevisiae Ty3 virus', 'Drosophila melanogaster Gypsy virus'],
  },

  // ---- Class VII: dsDNA-RT --------------------------------------------------
  Hepadnaviridae: {
    capsid: { value: 'icosahedral, T=4', confidence: 'established', note: 'a smaller T=3 form also assembles' },
    envelope: { value: true, confidence: 'established', note: 'surface antigen is also secreted as non-infectious subviral particles, in vast excess over virions' },
    receptor: { value: ['NTCP (SLC10A1)'], confidence: 'established', note: 'a bile-acid transporter restricted to hepatocytes — the reason tropism is so narrow' },
    replicationSite: { value: 'nucleus and cytoplasm', confidence: 'established', note: 'cccDNA is maintained in the nucleus; reverse transcription of pregenomic RNA happens inside cytoplasmic capsids' },
    tropism: { value: 'hepatocytes', confidence: 'established' },
    diameter: { value: [42, 42], confidence: 'established' },
    genomeSize: { value: '~3.2 kb', confidence: 'established', note: 'partially double-stranded, relaxed circular — the smallest genome of any DNA virus' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'A DNA virus that replicates through an RNA intermediate. Nuclear cccDNA is not touched by current antivirals, which is why treatment suppresses rather than cures.',
    notable: ['Hepatitis B virus'],
  },
}
