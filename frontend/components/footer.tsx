import Link from "next/link";
import { Separator } from "./ui/separator";


export default function Footer(){
    return(
        <div>
            <Separator></Separator>
            <footer className="bg-background flex justify-center p-10">
                <div className="flex flex-col justify-center items-center text-secondary">
                <Link href={"/equipo"}>
                    <p>©2025 Alquigest</p>
                </Link>
                <p>Derechos reservados</p>
                </div>
            </footer>
        </div>
    )
}