import React from 'react';
import { Patient } from '../types';
import { AppLogo } from './common/AppLogo';

interface PrescriptionTemplateProps {
  patient?: Patient;
  prescription: string[];
  date: Date;
}

export const PrescriptionTemplate: React.FC<PrescriptionTemplateProps> = ({
  patient,
  prescription,
  date,
}) => {

  const qrData = encodeURIComponent(
    "Dr. Hasnaa El Malki – CMHE Ait Melloul – Tel: 0528241119"
  );

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${qrData}`;

  return (
    <div
      className="mx-auto bg-white font-serif text-slate-900 box-border flex flex-col overflow-hidden"
      style={{
        width: '148mm',
        height: '210mm',
        padding: '6mm',
        pageBreakInside: 'avoid'
      }}
    >

<style>
{`
@media print {
  body { margin: 0; }
}
`}
</style>

{/* ================= HEADER ================= */}

<div className="grid grid-cols-[1fr_26mm_1fr] items-center border-b border-slate-800 pb-[1.5mm] mb-[2mm]">

{/* FR */}
<div className="flex flex-col justify-center text-left text-[8.5px] leading-[1] tracking-tight pr-2">

<h1 className="text-[11px] font-bold uppercase whitespace-nowrap m-0 p-0">
DR. HASNAA EL MALKI
</h1>

<p className="italic font-semibold m-0 p-0">Médecine Générale</p>
<p className="m-0 p-0">Lauréate FM Casablanca</p>
<p className="m-0 p-0">Écho – Marrakech</p>
<p className="m-0 p-0">Diabétologie – Paris 13</p>

<p className="font-semibold uppercase m-0 p-0">
Suivi Grossesse
</p>

</div>

{/* LOGO */}
<div className="flex justify-center items-center">
<AppLogo className="h-[21mm]" />
</div>

{/* AR */}
<div dir="rtl" className="flex flex-col justify-center text-right text-[8.5px] leading-[1] tracking-tight pl-2">

<h1 className="text-[11px] font-bold m-0 p-0">
الدكتورة حسناء المالكي
</h1>

<p className="font-semibold m-0 p-0">طب عام</p>
<p className="m-0 p-0">خريجة كلية الطب</p>
<p className="m-0 p-0">دبلوم الصدى</p>
<p className="m-0 p-0">دبلوم السكري</p>

<p className="font-semibold m-0 p-0">
تتبع الحمل
</p>

</div>

</div>

{/* ================= PATIENT ================= */}

<div className="border-b border-dotted pb-1 mb-2 text-[9px] flex justify-between">

<div>
<span className="font-bold">Patient :</span>{' '}
{patient
? `${patient.lastName.toUpperCase()} ${patient.firstName}`
: '................................'}
</div>

<div>
<span className="font-bold">Date :</span>{' '}
{new Date(date).toLocaleDateString('fr-FR')}
</div>

</div>

{/* ================= ORDONNANCE ================= */}

<h2 className="text-center font-black uppercase underline mb-3 tracking-widest text-[12px]">
Ordonnance
</h2>

<div className="flex-1">

<ul className="space-y-2">

{prescription.map((med, idx) => (
<li key={idx} className="flex text-[12px]">

<span className="mr-2 font-bold">{idx + 1}.</span>
<span>{med}</span>

</li>
))}

</ul>

</div>

{/* ================= FOOTER ================= */}

<div className="mt-auto border-t pt-2">

<div className="flex justify-between items-center mb-2">

<div className="border flex-1 h-[18mm] mr-3 text-center text-[7px] text-slate-400 flex items-center justify-center">
Signature & Cachet
</div>

<div className="w-[15mm] h-[15mm] border p-1">
<img src={qrUrl} className="w-full h-full object-contain" />
</div>

</div>

<div className="grid grid-cols-2 text-[8px] mb-1">

<div>
Imm. Damou 1er étage Route Biougra Ait Melloul
</div>

<div dir="rtl" className="text-right">
عمارة دامو الطابق الأول طريق بيوكرى أيت ملول
</div>

</div>

<div className="text-center text-[8px]">
05 28 24 11 19 – 06 41 23 83 44
</div>

<div className="text-center text-[7px] text-slate-400 mt-1">
chme25@gmail.com
</div>

</div>

</div>
);
};
