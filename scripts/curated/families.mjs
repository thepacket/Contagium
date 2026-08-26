// Curated mechanism data for the first family group.
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
//       established — well characterised, not seriously disputed
//       varies      — genuinely differs across genera/species in the family
//       contested   — reported, but the literature disagrees
//       unknown     — not characterised; rendered as absent, not guessed
//   * `note` carries the caveat when a single value would mislead.
//   * Nothing here is a number the VMR could have given us. Baltimore class,
//     host range and genome composition are derived in build-catalog.mjs from
//     the VMR itself rather than typed out again.
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
    tropism: { value: 'broad; epithelial and myeloid', confidence: 'established' },
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
    tropism: { value: 'respiratory, ocular and gastrointestinal epithelium', confidence: 'established' },
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
    genomeSize: { value: '~5 kb', confidence: 'established', note: 'circular dsDNA' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Persists asymptomatically in most adults; disease is largely a consequence of immunosuppression.',
    notable: ['JC polyomavirus', 'BK polyomavirus', 'Simian virus 40'],
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
    genomeSize: { value: '4–6 kb', confidence: 'established', note: 'linear ssDNA' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Carries no polymerase and cannot make one — replication depends on a host cell already in S phase.',
    notable: ['Human parvovirus B19', 'Adeno-associated virus 2'],
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
    tropism: { value: 'mature enterocytes of the small intestine', confidence: 'established' },
    genomeSize: { value: '18–21 kb total', confidence: 'established' },
    segments: { value: 11, confidence: 'established', note: '11 for rotavirus; segment number varies across the family' },
    distinctive: 'Keeps its dsRNA genome inside the capsid throughout replication, which avoids exposing it to cytoplasmic dsRNA sensors.',
    notable: ['Rotavirus A'],
  },

  // ---- Class IV: +ssRNA -----------------------------------------------------
  Coronaviridae: {
    capsid: { value: 'helical nucleocapsid', confidence: 'established' },
    envelope: { value: true, confidence: 'established', note: 'club-shaped spike projections give the family its name' },
    receptor: {
      value: ['ACE2', 'DPP4', 'aminopeptidase N', '9-O-acetylated sialic acid'],
      confidence: 'varies',
      note: 'ACE2 for SARS-CoV, SARS-CoV-2 and HCoV-NL63; DPP4 for MERS-CoV; APN for HCoV-229E; sialic acid for HCoV-OC43 and HKU1',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established', note: 'within virus-induced double-membrane vesicles' },
    tropism: { value: 'respiratory and enteric epithelium', confidence: 'varies' },
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
    genomeSize: { value: '9.6–12.3 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Antibody-dependent enhancement between dengue serotypes is the clearest case where prior immunity worsens rather than protects.',
    notable: ['Dengue virus', 'Zika virus', 'Yellow fever virus', 'West Nile virus', 'Hepatitis C virus'],
  },

  Caliciviridae: {
    capsid: { value: 'icosahedral, T=3', confidence: 'established' },
    envelope: { value: false, confidence: 'established' },
    receptor: {
      value: ['histo-blood group antigens (attachment)', 'CD300lf (murine norovirus)'],
      confidence: 'contested',
      note: 'HBGAs are established attachment factors and explain genetic resistance in FUT2 non-secretors; the human norovirus proteinaceous receptor is not settled. CD300lf is established for murine norovirus',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: { value: 'intestinal epithelium', confidence: 'established' },
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
    genomeSize: { value: '11–12 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Structural proteins come from a separate subgenomic RNA, so they can be made in vast excess over the replicase.',
    notable: ['Chikungunya virus', 'Venezuelan equine encephalitis virus', 'Sindbis virus'],
  },

  Matonaviridae: {
    capsid: { value: 'icosahedral', confidence: 'established', note: 'pleomorphic particles' },
    envelope: { value: true, confidence: 'established' },
    receptor: { value: ['MOG (myelin oligodendrocyte glycoprotein)'], confidence: 'established' },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: { value: 'respiratory epithelium, then systemic; placental and fetal', confidence: 'established' },
    genomeSize: { value: '~9.8 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Split out of Togaviridae in 2018. Its clinical weight is almost entirely congenital rather than acute.',
    notable: ['Rubella virus'],
  },

  Hepeviridae: {
    capsid: { value: 'icosahedral, T=3', confidence: 'established' },
    envelope: { value: false, confidence: 'varies', note: 'non-enveloped when shed in bile and faeces, but quasi-enveloped in a host-derived membrane while circulating in blood' },
    receptor: { value: null, confidence: 'unknown', note: 'heparan sulfate proteoglycans act as attachment factors; no receptor established' },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: { value: 'hepatocytes', confidence: 'established' },
    genomeSize: { value: '~7.2 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Exists in two physical forms depending on which compartment it is in — a rare case where "enveloped" is not a fixed property of the family.',
    notable: ['Hepatitis E virus'],
  },

  // ---- Class V: −ssRNA ------------------------------------------------------
  Orthomyxoviridae: {
    capsid: { value: 'helical ribonucleoproteins', confidence: 'established' },
    envelope: { value: true, confidence: 'established', note: 'pleomorphic, spherical to filamentous' },
    receptor: {
      value: ['sialic acid (α2,6-linked)', 'sialic acid (α2,3-linked)'],
      confidence: 'established',
      note: 'α2,6 preference in human upper airway, α2,3 in avian enteric tract — the linkage preference is central to host range and to what a spillover strain must change',
    },
    replicationSite: { value: 'nucleus', confidence: 'established', note: 'unusual for an RNA virus; enables cap-snatching from host transcripts and splicing of viral mRNAs' },
    tropism: { value: 'respiratory epithelium', confidence: 'established' },
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
    genomeSize: { value: '13–15 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Split from Paramyxoviridae in 2016. Stabilising the fusion protein in its prefusion conformation is what finally made an RSV vaccine work, after a formalin-inactivated candidate worsened disease in the 1960s.',
    notable: ['Human respiratory syncytial virus', 'Human metapneumovirus'],
  },

  Rhabdoviridae: {
    capsid: { value: 'helical nucleocapsid', confidence: 'established', note: 'bullet-shaped virion' },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['nAChR', 'NCAM', 'p75NTR', 'LDL receptor (VSV)'],
      confidence: 'varies',
      note: 'several candidates reported for rabies virus and none is exclusive; the LDL receptor is established for vesicular stomatitis virus',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: { value: 'neurons (rabies); broad in vitro', confidence: 'varies' },
    genomeSize: { value: '11–15 kb', confidence: 'established' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'Rabies travels to the CNS by retrograde axonal transport, which is why the incubation period depends on where the bite was.',
    notable: ['Rabies lyssavirus', 'Vesicular stomatitis Indiana virus'],
  },

  Filoviridae: {
    capsid: { value: 'helical nucleocapsid', confidence: 'established', note: 'filamentous virion, often looped or branched, up to ~1400 nm long' },
    envelope: { value: true, confidence: 'established' },
    receptor: {
      value: ['NPC1'],
      confidence: 'established',
      note: 'NPC1 is intracellular, in the late endosome — binding requires prior cathepsin cleavage of GP. Surface molecules such as TIM-1, TAM receptors and DC-SIGN act as attachment factors, not receptors',
    },
    replicationSite: { value: 'cytoplasm', confidence: 'established' },
    tropism: { value: 'monocytes, macrophages, dendritic cells, then hepatocytes and endothelium', confidence: 'established' },
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
    tropism: { value: 'vascular endothelium', confidence: 'established' },
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
    tropism: { value: 'endothelium, hepatocytes and mononuclear phagocytes', confidence: 'established' },
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
    genomeSize: { value: '11–12 kb total', confidence: 'established' },
    segments: { value: 3, confidence: 'established', note: 'L, M and S; the S segment is ambisense' },
    distinctive: 'Rift Valley fever outbreaks track heavy rainfall flooding mosquito breeding habitat, which makes them among the more genuinely forecastable arboviral events.',
    notable: ['Rift Valley fever phlebovirus', 'Dabie bandavirus (SFTSV)', 'Toscana phlebovirus'],
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
    genomeSize: { value: '7–12 kb', confidence: 'established', note: 'two copies per particle — the genome is diploid' },
    segments: { value: 1, confidence: 'established', note: 'one genome, but packaged as two identical copies' },
    distinctive: 'Integrates into host DNA as a provirus. That is why infection is lifelong, and why cure requires clearing a latent reservoir rather than suppressing replication.',
    notable: ['Human immunodeficiency virus 1', 'Human T-cell leukemia virus 1'],
  },

  // ---- Class VII: dsDNA-RT --------------------------------------------------
  Hepadnaviridae: {
    capsid: { value: 'icosahedral, T=4', confidence: 'established', note: 'a smaller T=3 form also assembles' },
    envelope: { value: true, confidence: 'established', note: 'surface antigen is also secreted as non-infectious subviral particles, in vast excess over virions' },
    receptor: { value: ['NTCP (SLC10A1)'], confidence: 'established', note: 'a bile-acid transporter restricted to hepatocytes — the reason tropism is so narrow' },
    replicationSite: { value: 'nucleus and cytoplasm', confidence: 'established', note: 'cccDNA is maintained in the nucleus; reverse transcription of pregenomic RNA happens inside cytoplasmic capsids' },
    tropism: { value: 'hepatocytes', confidence: 'established' },
    genomeSize: { value: '~3.2 kb', confidence: 'established', note: 'partially double-stranded, relaxed circular — the smallest genome of any DNA virus' },
    segments: { value: 1, confidence: 'established' },
    distinctive: 'A DNA virus that replicates through an RNA intermediate. Nuclear cccDNA is not touched by current antivirals, which is why treatment suppresses rather than cures.',
    notable: ['Hepatitis B virus'],
  },
}
