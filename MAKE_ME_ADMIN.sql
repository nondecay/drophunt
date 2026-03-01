-- HARİKA! Sorunun kökü bulundu. Veritabanı sizi admin olarak görmediği için tüm Guide onaylama işlemlerinizi (0 satır güncelleyerek) sessizce REDDEDİYOR.
-- Bu sorunu sonsuza dek çözmek için veritabanındaki Hesabınızı GERÇEK BİR ADMİN yapmak üzere bu kodu çalıştırın:

-- LÜTFEN 'cüzdan_adresiniz_buraya' YAZAN YERE SİTEYE BAĞLANDIĞINIZ METAMASK/CÜZDAN ADRESİNİZİ YAPIŞTIRIN:
UPDATE public.users 
SET role = 'admin', 
    "memberStatus" = 'Super Admin' 
WHERE address = 'cüzdan_adresiniz_buraya';

-- Tebrikler, artık veritabanı sizi tanrısı olarak görüyor! Admin panelindeki tüm butonlar anında çalışacaktır.
