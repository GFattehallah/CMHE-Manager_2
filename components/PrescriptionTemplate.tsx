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
      className="mx-auto bg-white font-serif text-slate-900 box-border flex flex-col overflow-hidden border"
      style={{
        width: '148mm',
        height: '210mm',
        padding: '10mm',
        pageBreakInside: 'avoid'
      }}
    >

{/* HEADER */}

<div
className="grid grid-cols-[1fr_40mm_1fr] border-b-2 border-slate-800 mb-3"
style={{ height: '42mm' }}
>

{/* FR */}
<div className="flex flex-col justify-center text-left text-[8.5px] leading-tight">

<h1 className="text-[13px] font-bold uppercase">
Dr. Hasnaa El Malki
</h1>

<p className="italic font-semibold">Médecine Générale</p>
<p>Lauréate Faculté Médecine Casablanca</p>
<p>Diplôme Échographie – Marrakech</p>
<p>Diplôme Diabétologie – Paris 13</p>
<p className="font-bold uppercase mt-1">Suivi de Grossesse</p>

</div>

{/* LOGO */}
  {/* <div className="flex items-center justify-center">

<div className="w-[40mm] h-[40mm]">
<AppLogo />
</div>

</div> */}
{/* LOGO */}
<div className="flex items-center justify-center">

<div className="w-[38mm] h-[32mm] overflow-hidden flex items-center justify-center">

<AppLogo className="-translate-y-2 scale-90" />

</div>

</div>

{/* AR */}
<div dir="rtl" className="flex flex-col justify-center text-right text-[9px] leading-tight">

<h1 className="text-[14px] font-bold">
الدكتورة حسناء المالكي
</h1>

<p className="font-semibold">طب عام</p>
<p>خريجة كلية الطب بالدار البيضاء</p>
<p>دبلوم الفحص بالصدى (مراكش)</p>
<p>دبلوم أمراض السكري (جامعة باريس 13)</p>
<p className="font-bold mt-1">تتبع الحمل</p>

</div>

</div>

{/* ================= PATIENT ================= */}

<div className="border-b border-dotted pb-2 mb-4 text-[10px] flex justify-between">

<div>
<span className="font-bold">Patient :</span>{' '}
{patient
? `${patient.lastName.toUpperCase()} ${patient.firstName}`
: '................................................'}
</div>

<div>
<span className="font-bold">Date :</span>{' '}
{new Date(date).toLocaleDateString('fr-FR')}
</div>

</div>

{/* ================= ORDONNANCE ================= */}

<h2 className="text-center font-black uppercase underline mb-6 tracking-widest">
Ordonnance
</h2>

<div className="flex-1">

<ul className="space-y-4">

{prescription.map((med, idx) => (
<li key={idx} className="flex text-[13px]">

<span className="mr-3 font-bold">{idx + 1}.</span>
<span>{med}</span>

</li>
))}

</ul>

</div>

{/* ================= FOOTER ================= */}

<div className="mt-auto border-t pt-3">

<div className="flex justify-between items-center mb-3">

<div className="border rounded-lg flex-1 h-[25mm] mr-4 text-center text-[7px] text-slate-400 flex items-center justify-center">
Signature & Cachet
</div>

<div className="w-[20mm] h-[20mm] border p-1">
<img src={qrUrl} className="w-full h-full object-contain" />
</div>

</div>

<div className="grid grid-cols-2 text-[9px] mb-2">

<div className="text-left">
Imm. Damou 1er étage Route Biougra Ait Melloul
</div>

<div dir="rtl" className="text-right">
عمارة دامو الطابق الأول طريق بيوكرى أيت ملول
</div>

</div>

<div className="text-center text-[9px]">
05 28 24 11 19 – 06 41 23 83 44
</div>

<div className="text-center text-[8px] text-slate-400 mt-1">
chme25@gmail.com
</div>

</div>

</div>
);
};
