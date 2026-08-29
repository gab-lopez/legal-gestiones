namespace backend.Services;

public static class NumerosALetrasService
{
    private static readonly string[] Unidades = {
        "", "uno", "dos", "tres", "cuatro", "cinco",
        "seis", "siete", "ocho", "nueve", "diez",
        "once", "doce", "trece", "catorce", "quince",
        "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte",
        "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco",
        "veintiséis", "veintisiete", "veintiocho", "veintinueve"
    };

    private static readonly string[] Decenas = {
        "", "diez", "veinte", "treinta", "cuarenta", "cincuenta",
        "sesenta", "setenta", "ochenta", "noventa"
    };

    private static readonly string[] Centenas = {
        "", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
        "seiscientos", "setecientos", "ochocientos", "novecientos"
    };

    // Convierte número entero a letras
    public static string NumeroALetras(long numero)
    {
        if (numero == 0) return "cero";
        if (numero < 0) return "menos " + NumeroALetras(-numero);

        string resultado = "";

        if (numero >= 1000000)
        {
            long millones = numero / 1000000;
            resultado += millones == 1
                ? "un millón "
                : NumeroALetras(millones) + " millones ";
            numero %= 1000000;
        }

        if (numero >= 1000)
        {
            long miles = numero / 1000;
            resultado += miles == 1
                ? "mil "
                : NumeroALetras(miles) + " mil ";
            numero %= 1000;
        }

        if (numero >= 100)
        {
            if (numero == 100)
                resultado += "cien ";
            else
                resultado += Centenas[numero / 100] + " ";
            numero %= 100;
        }

        if (numero > 0)
        {
            if (numero < 30)
                resultado += Unidades[numero] + " ";
            else
            {
                resultado += Decenas[numero / 10] + " ";
                if (numero % 10 > 0)
                    resultado += "y " + Unidades[numero % 10] + " ";
            }
        }

        return resultado.Trim();
    }

    // Convierte monto a formato quetzales en letras
    // Ej: 20500.50 → "VEINTE MIL QUINIENTOS QUETZALES CON CINCUENTA CENTAVOS (Q.20,500.50)"
    public static string MontoALetras(decimal monto)
    {
        long entero     = (long)Math.Floor(monto);
        int  centavos   = (int)Math.Round((monto - entero) * 100);
        string letras   = NumeroALetras(entero).ToUpper();
        string formato  = monto.ToString("N2");

        string resultado = centavos > 0
            ? $"{letras} QUETZALES CON {NumeroALetras(centavos).ToUpper()} CENTAVOS (Q.{formato})"
            : $"{letras} QUETZALES (Q.{formato})";

        return resultado;
    }

    // Convierte fecha a letras en español
    // Ej: 2026-05-02 → "dos de mayo de dos mil veintiséis"
    public static string FechaALetras(DateTime fecha)
    {
        string[] meses = {
            "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
        };
        string dia  = NumeroALetras(fecha.Day);
        string mes  = meses[fecha.Month];
        string anio = NumeroALetras(fecha.Year);
        return $"{dia} ({fecha.Day}) de {mes} de {anio} ({fecha.Year})";
    }

    // Convierte número de DPI a letras
    // Ej: "2371 36805 0101" → "dos mil trescientos setenta y uno espacio
    //      treinta y seis mil ochocientos cinco espacio cero ciento uno"
    public static string DpiALetras(string dpi)
    {
        var partes = dpi.Replace("-", " ").Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var resultado = new List<string>();

        foreach (var parte in partes)
        {
            if (long.TryParse(parte, out long numero))
                resultado.Add(NumeroALetras(numero));
            else
                resultado.Add(parte);
        }

        return string.Join(" espacio ", resultado);
    }

    // Convierte número de registro mercantil a letras con formato
    // Ej: "774712" → "setecientos setenta y cuatro mil setecientos doce (774712)"
    public static string RegistroALetras(string numero)
    {
        if (long.TryParse(numero, out long n))
            return $"{NumeroALetras(n)} ({numero})";
        return numero;
    }
}